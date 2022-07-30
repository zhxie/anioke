import getAppDataPath from "appdata-path";
import express from "express";
import pathToFfmpeg from "ffmpeg-static";
import fs from "fs";
import { internalIpV4Sync } from "internal-ip";
import { camel } from "snake-camel";
import {
  BilibiliMVProvider,
  PetitLyricsLyricsProvider,
  YoutubeMVProvider,
} from "./models";
import { Database, Downloader, Encoder, Player } from "./components";

class Server {
  mvProviders = [new BilibiliMVProvider(), new YoutubeMVProvider()];
  lyricsProviders = [new PetitLyricsLyricsProvider()];
  database;
  downloader;
  encoder;
  player;
  server = express();
  listener;

  constructor(host, onPlay, onStop, onSeek, onSwitchTrack, onOffset) {
    // Create app data directory.
    const appDataPath = getAppDataPath("Anioke");
    fs.mkdirSync(appDataPath, { recursive: true });

    // Read config from config.json.
    const localConfigPath = "config.json";
    const defaultConfigPath = `${appDataPath}/config.json`;
    let rawConfig;
    if (fs.existsSync(localConfigPath)) {
      rawConfig = fs.readFileSync(localConfigPath);
    } else if (fs.existsSync(defaultConfigPath)) {
      rawConfig = fs.readFileSync(defaultConfigPath);
    } else {
      rawConfig = "{}";
    }
    const config = JSON.parse(rawConfig);

    // Configure providers.
    const providersConfig = config["providers"] ?? {};
    const mvConfig = providersConfig["mv"] ?? {};
    for (let i = this.mvProviders.length - 1; i >= 0; i--) {
      let provider = this.mvProviders[i];
      let config = mvConfig[camel(provider.name())] ?? {};
      if (config["hidden"]) {
        this.mvProviders.splice(i, 1);
      }

      provider.configure(config);
    }
    const lyricsConfig = providersConfig["lyrics"] ?? {};
    for (let i = this.lyricsProviders.length - 1; i >= 0; i--) {
      let provider = this.lyricsProviders[i];
      let config = lyricsConfig[camel(provider.name())] ?? {};
      if (config["hidden"]) {
        this.lyricsProviders.splice(i, 1);
      }

      provider.configure(config);
    }

    // Setup database.
    const databaseConfig = config["database"] ?? {};
    this.database = new Database(
      databaseConfig["location"] || `${appDataPath}/Anioke.db`
    );

    // Setup downloader.
    const downloadConfig = config["download"] ?? {};
    this.downloader = new Downloader(
      downloadConfig["ytDlp"] ||
        pathToFfmpeg
          // HACK: Reinterpret yt-dlp binary path from ffmpeg-static.
          .replace("ffmpeg-static", "@alpacamybags118/yt-dlp-exec/bin")
          .replace("ffmpeg", "yt-dlp")
          .replace("app.asar", "app.asar.unpacked"),
      downloadConfig["location"] || `${appDataPath}/Media`,
      this.handleDownloadComplete
    );

    // Setup encoder.
    const encodeConfig = config["encode"] ?? {};
    this.encoder = new Encoder(
      encodeConfig["ffmpeg"] ||
        pathToFfmpeg.replace("app.asar", "app.asar.unpacked"),
      encodeConfig["method"] || "remove_center_channel",
      encodeConfig["script"],
      this.handleEncodeComplete
    );

    // Setup player.
    this.player = new Player(
      (entry) => {
        const offset = this.database.select(entry.mv().id()).offset ?? 0;
        onPlay(entry.formatToPlayerEntry(offset));
      },
      onStop,
      onSeek,
      onSwitchTrack,
      (mvId, offset) => {
        const prev = this.database.select(mvId).offset ?? 0;
        this.database.updateOffset(mvId, prev + offset);
        onOffset(prev + offset);
      }
    );

    // Setup server.
    const serverConfig = config["server"] ?? {};
    this.server.use(express.json());
    this.server.options("*", (_req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Method", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.send();
    });
    this.server.get("/connect", (_req, res) => {
      res.send({
        mv: this.mvProviders.map((provider) => provider.name()),
        lyrics: this.lyricsProviders.map((provider) => provider.name()),
      });
    });
    this.server.get("/search", async (req, res) => {
      try {
        let result = {};
        const title = req.query["title"];
        const mvProvider = req.query["mv"];
        if (mvProvider) {
          const mv = (
            await this.mvProviders
              .find((provider) => provider.name() == mvProvider)
              .search(title)
          ).map(async (entry) => {
            const lyricsId = this.database.select(entry.id()).lyrics;
            let lyrics;
            if (lyricsId) {
              lyrics = await (
                await this.getLyricsWithId(lyricsId)
              ).format(false);
            }
            return entry.format(lyrics);
          });
          result["mv"] = await Promise.all(mv);
        }
        const artist = req.query["artist"] ?? "";
        const lyricsProvider = req.query["lyrics"];
        if (lyricsProvider) {
          const lyrics = (
            await this.lyricsProviders
              .find((provider) => provider.name() == lyricsProvider)
              .searchByTitleAndArtist(title, artist)
          ).map((entry) => entry.format(false));
          result["lyrics"] = await Promise.all(lyrics);
        }
        res.send(result);
      } catch (e) {
        console.error(e);
        res.status(400).send({ error: e.message });
      }
    });
    this.server.get("/mv", async (req, res) => {
      try {
        const id = req.query["id"];
        const mv = await this.getMVWithId(id);
        const lyricsId = this.database.select(id).lyrics;
        let lyrics;
        if (lyricsId) {
          lyrics = await (await this.getLyricsWithId(lyricsId)).format(false);
        }
        res.send(mv.format(lyrics));
      } catch (e) {
        console.error(e);
        res.status(400).send({ error: e.message });
      }
    });
    this.server.get("/lyrics", async (req, res) => {
      try {
        const lyrics = await this.getLyricsWithId(req.query["id"]);
        res.send(lyrics.format(true));
      } catch (e) {
        console.error(e);
        res.status(400).send({ error: e.message });
      }
    });
    this.server.post("/order", async (req, res) => {
      try {
        const body = req.body;
        const mvId = body["mv"];
        const mvSource = mvId.split(".")[0];
        const mv = await this.mvProviders
          .find((provider) => provider.name() == mvSource)
          .get(mvId);
        const lyricsId = body["lyrics"];
        const lyricsSource = lyricsId.split(".")[0];
        const lyrics = await this.lyricsProviders
          .find((provider) => provider.name() == lyricsSource)
          .get(lyricsId);
        // Bind in database.
        this.database.bind(mvId, lyricsId);
        this.downloader.add(mv, lyrics);
        res.send({});
      } catch (e) {
        console.error(e);
        res.status(400).send({ error: e.message });
      }
    });
    this.server.post("/remove", (req, res) => {
      const sequence = Number(req.body["sequence"]);
      this.downloader.remove(sequence);
      this.encoder.remove(sequence);
      this.player.remove(sequence);
      res.send({});
    });
    this.server.post("/skip", (_req, res) => {
      this.player.skip();
      res.send({});
    });
    this.server.post("/replay", (_req, res) => {
      this.player.replay();
      res.send({});
    });
    this.server.post("/switch", async (_req, res) => {
      this.player.switchTrack();
      res.send({});
    });
    this.server.post("/offset", (req, res) => {
      this.player.offset(Number(req.body["time"]));
      res.send({});
    });
    this.server.post("/shuffle", (_req, res) => {
      this.player.shuffle();
      res.send({});
    });
    this.server.post("/topmost", (req, res) => {
      this.player.topmost(Number(req.body["sequence"]));
      res.send({});
    });
    this.server.post("/retry", (req, res) => {
      const sequence = Number(req.body["sequence"]);
      this.downloader.retry(sequence);
      this.encoder.retry(sequence);
      res.send({});
    });
    this.server.get("/playlist", async (_req, res) => {
      try {
        const list = this.player
          .list()
          .concat(this.encoder.list())
          .concat(this.downloader.list())
          .map((entry) => entry.format());
        const result = await Promise.all(list);
        res.send(result);
      } catch (e) {
        console.error(e);
        res.status(400).send({ error: e.message });
      }
    });
    this.server.get("/web-ui", (_req, res) => {
      res.redirect("/web-ui.html");
    });
    this.server.use("/", host);
    this.listener = this.server.listen(serverConfig["port"] || 0, "0.0.0.0");
  }

  getMVWithId = async (id) => {
    const source = id.split(".")[0];
    const mv = await this.mvProviders
      .find((provider) => provider.name() == source)
      .get(id);
    return mv;
  };

  getLyricsWithId = async (id) => {
    const source = id.split(".")[0];
    const lyrics = await this.lyricsProviders
      .find((provider) => provider.name() == source)
      .get(id);
    return lyrics;
  };

  handleDownloadComplete = (entry) => {
    this.encoder.add(entry);
  };

  handleEncodeComplete = (entry) => {
    this.player.add(entry);
  };

  handleReady = () => {
    return `http://${internalIpV4Sync()}:${this.listener.address().port}`;
  };

  handlePlayerEnded = () => {
    this.player.next();
  };
}

export default Server;
