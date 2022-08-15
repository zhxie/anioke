import getAppDataPath from "appdata-path";
import deepExtend from "deep-extend";
import express from "express";
import pathToFfmpeg from "ffmpeg-static";
import fs from "fs";
import { internalIpV4Sync } from "internal-ip";
import { camel } from "snake-camel";
import {
  BilibiliMVProvider,
  JoysoundLyricsProvider,
  PetitLyricsLyricsProvider,
  YoutubeMVProvider,
} from "./models";
import { Database, Downloader, Encoder, Player, Subtitler } from "./components";

const defaultConfig = {
  server: {
    port: 0,
  },
  database: {
    location: "",
  },
  download: {
    ytDlp: "",
    location: "",
  },
  encode: {
    ffmpeg: "",
    method: "remove_center_channel",
    script: "",
  },
  subtitle: {
    style: "karaoke",
    countdown: false,
  },
  providers: {
    mv: {
      bilibili: {
        hidden: false,
      },
      youtube: {
        hidden: false,
        key: "",
      },
    },
    lyrics: {
      joysound: {
        hidden: false,
      },
      petitLyrics: {
        hidden: false,
      },
    },
  },
};

class Server {
  mvProviders = [new BilibiliMVProvider(), new YoutubeMVProvider()];
  lyricsProviders = [
    new JoysoundLyricsProvider(),
    new PetitLyricsLyricsProvider(),
  ];
  configPath;
  config = defaultConfig;
  database;
  downloader;
  encoder;
  subtitler;
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
    this.configPath = defaultConfigPath;
    if (fs.existsSync(localConfigPath)) {
      this.configPath = localConfigPath;
    }
    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, "{}");
    }
    const rawConfig = fs.readFileSync(this.configPath);
    const config = JSON.parse(rawConfig);
    deepExtend(this.config, config);

    // Configure providers.
    const providersConfig = this.config["providers"];
    const mvConfig = providersConfig["mv"];
    for (let i = this.mvProviders.length - 1; i >= 0; i--) {
      let provider = this.mvProviders[i];
      let config = mvConfig[camel(provider.name())];
      if (config["hidden"]) {
        this.mvProviders.splice(i, 1);
      }

      provider.configure(config);
    }
    const lyricsConfig = providersConfig["lyrics"];
    for (let i = this.lyricsProviders.length - 1; i >= 0; i--) {
      let provider = this.lyricsProviders[i];
      let config = lyricsConfig[camel(provider.name())];
      if (config["hidden"]) {
        this.lyricsProviders.splice(i, 1);
      }

      provider.configure(config);
    }

    // Setup database.
    const databaseConfig = this.config["database"];
    this.database = new Database(
      databaseConfig["location"] || `${appDataPath}/Anioke.db`
    );
    // TODO: Upgrade database should be sync, but it includes async methods.
    this.database.upgrade(this.getLyricsWithId);

    // Setup downloader.
    const downloadConfig = this.config["download"];
    const encodeConfig = this.config["encode"];
    const ffmpegPath =
      encodeConfig["ffmpeg"] ||
      pathToFfmpeg.replace("app.asar", "app.asar.unpacked");
    this.downloader = new Downloader(
      downloadConfig["ytDlp"] ||
        pathToFfmpeg
          // HACK: Reinterpret yt-dlp binary path from ffmpeg-static.
          .replace("ffmpeg-static", "@alpacamybags118/yt-dlp-exec/bin")
          .replace("ffmpeg", "yt-dlp")
          .replace("app.asar", "app.asar.unpacked"),
      ffmpegPath,
      downloadConfig["location"] || `${appDataPath}/Media`,
      this.handleDownloadComplete
    );

    // Setup encoder.
    this.encoder = new Encoder(
      ffmpegPath,
      encodeConfig["method"] || "remove_center_channel",
      encodeConfig["script"],
      this.handleEncodeComplete
    );

    // Setup subtitler.
    const subtitleConfig = this.config["subtitle"];
    this.subtitler = new Subtitler(
      subtitleConfig["style"] || "karaoke",
      subtitleConfig["countdown"] || false
    );

    // Setup player.
    this.player = new Player(
      (entry) => {
        const offset = this.database.select(entry.mv().id()).offset() ?? 0;
        onPlay(entry.formatToPlayerEntry(offset));
      },
      onStop,
      onSeek,
      onSwitchTrack,
      (mvId, offset) => {
        const prev = this.database.select(mvId).offset() ?? 0;
        this.database.updateOffset(mvId, prev + offset);
        onOffset(prev + offset);
      }
    );

    // Setup server.
    const serverConfig = this.config["server"];
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
              .find((provider) => provider.name() === mvProvider)
              .search(title)
          ).map(async (entry) => {
            const lyricsId = this.database.select(entry.id()).lyrics();
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
              .find((provider) => provider.name() === lyricsProvider)
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
        const lyricsId = this.database.select(id).lyrics();
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
        const mv = await this.getMVWithId(mvId);
        const lyricsId = body["lyrics"];
        const lyrics = await this.getLyricsWithId(lyricsId);
        // Bind in database.
        this.database.bind(mvId, lyrics);
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
    this.server.get("/library", (_req, res) => {
      const records = this.database.selectAll();
      const result = records.map((record) => record.format());
      res.send(result);
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
      .find((provider) => provider.name() === source)
      .get(id);
    return mv;
  };

  getLyricsWithId = async (id) => {
    const source = id.split(".")[0];
    const lyrics = await this.lyricsProviders
      .find((provider) => provider.name() === source)
      .get(id);
    return lyrics;
  };

  handleDownloadComplete = (entry) => {
    this.encoder.add(entry);
  };

  handleEncodeComplete = (entry) => {
    // Compile lyrics.
    const lyricsPath = entry.lyricsPath();
    const lyrics = fs.readFileSync(lyricsPath.replace(/.ass$/, ".json"));
    const lines = JSON.parse(lyrics);
    const ass = this.subtitler.compile(lines, entry.lyrics());
    fs.writeFileSync(lyricsPath, ass);

    this.player.add(entry);
  };

  handleReady = () => {
    return {
      addr: `http://${internalIpV4Sync()}:${this.listener.address().port}`,
      config: this.config,
    };
  };

  handleConfig = (config) => {
    fs.writeFileSync(this.configPath, JSON.stringify(config, undefined, 2));
  };

  handlePlayerEnded = () => {
    this.player.next();
  };
}

export default Server;
