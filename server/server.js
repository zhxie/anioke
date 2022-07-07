import getAppDataPath from "appdata-path";
import express from "express";
import fs from "fs";
import { internalIpV4Sync } from "internal-ip";
import PetitLyricsLyricsProvider from "./models/lyrics/petit-lyrics/provider";
import BilibiliMVProvider from "./models/mv/bilibili/provider";
import YoutubeMVProvider from "./models/mv/youtube/provider";
import Database from "./utils/database/database";
import Downloader from "./utils/download/downloader";
import Encoder from "./utils/encode/encoder";
import Player from "./utils/play/player";

class Server {
  mvProviders = [new BilibiliMVProvider(), new YoutubeMVProvider()];
  lyricsProviders = [new PetitLyricsLyricsProvider()];
  database;
  downloader;
  encoder;
  player;
  server = express();
  listener;

  constructor(onPlay, onStop, onSeek, onSwitchTrack, onOffset) {
    // Create app data directory.
    const appDataPath = getAppDataPath("Anioke");
    console.log(appDataPath);
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
    for (let provider of this.mvProviders) {
      provider.configure(mvConfig[provider.name()] ?? {});
    }
    const lyricsConfig = providersConfig["lyrics"] ?? {};
    for (let provider of this.lyricsProviders) {
      provider.configure(lyricsConfig[provider.name()] ?? {});
    }

    // Setup database.
    const databaseConfig = config["database"] ?? {};
    this.database = new Database(
      databaseConfig["location"] ?? `${appDataPath}/Anioke.db`
    );

    // Setup downloader.
    const downloadConfig = config["download"] ?? {};
    this.downloader = new Downloader(
      downloadConfig["location"] ?? `${appDataPath}/Media`,
      downloadConfig["yt-dlp"] ?? "yt-dlp",
      this.handleDownloadComplete
    );

    // Setup encoder.
    const encodeConfig = config["encode"] ?? {};
    this.encoder = new Encoder(
      encodeConfig["method"] ?? "ffmpeg",
      encodeConfig["ffmpeg"] ?? "ffmpeg",
      encodeConfig["sox"],
      this.handleEncodeComplete
    );

    // Setup player.
    this.player = new Player(
      (entry) => {
        const offset = this.database.select(entry.mv().id()).offset ?? 0;
        onPlay(entry.sequence(), entry.mvPath(), entry.lyricsPath(), offset);
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
    this.server.get("/order", async (req, res) => {
      try {
        const mvId = req.query["mv"];
        const mvSource = mvId.split(".")[0];
        const mv = await this.mvProviders
          .find((provider) => provider.name() == mvSource)
          .get(mvId);
        const lyricsId = req.query["lyrics"];
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
    this.server.get("/remove", (req, res) => {
      const sequence = Number(req.query["sequence"]);
      this.downloader.remove(sequence);
      this.encoder.remove(sequence);
      this.player.remove(sequence);
      res.send({});
    });
    this.server.get("/skip", (_req, res) => {
      this.player.skip();
      res.send({});
    });
    this.server.get("/replay", (_req, res) => {
      this.player.replay();
      res.send({});
    });
    this.server.get("/switch", async (_req, res) => {
      this.player.switchTrack();
      res.send({});
    });
    this.server.get("/offset", (req, res) => {
      this.player.offset(Number(req.query["time"]));
      res.send({});
    });
    this.server.get("/shuffle", (_req, res) => {
      this.player.shuffle();
      res.send({});
    });
    this.server.get("/topmost", (req, res) => {
      this.player.topmost(Number(req.query["sequence"]));
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
    this.listener = this.server.listen(serverConfig["port"] ?? 0, "0.0.0.0");
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
    return {
      ip: internalIpV4Sync(),
      port: this.listener.address().port,
    };
  };

  handlePlayerEnded = () => {
    this.player.next();
  };
}

export default Server;
