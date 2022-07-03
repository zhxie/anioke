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
  readyCallback;

  mvProviders = [new BilibiliMVProvider(), new YoutubeMVProvider()];
  lyricsProviders = [new PetitLyricsLyricsProvider()];
  database;
  downloader;
  encoder;
  player;
  server = express();
  listener;

  constructor(onReady, onPlay, onStop, onSeek, onSwitchTrack, onOffset) {
    this.readyCallback = onReady;

    // Read config from config.json.
    const rawConfig = fs.readFileSync("config.json");
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
    this.database = new Database(databaseConfig["location"] ?? "./anioke.db");

    // Setup downloader.
    const downloadConfig = config["download"] ?? {};
    this.downloader = new Downloader(
      downloadConfig["location"] ?? "./cache",
      downloadConfig["yt-dlp"] ?? "yt-dlp",
      (entry) => {
        this.handleDownloadComplete(entry);
      }
    );

    // Setup encoder.
    const encodeConfig = config["encode"] ?? {};
    this.encoder = new Encoder(
      encodeConfig["method"] ?? "ffmpeg",
      encodeConfig["ffmpeg"] ?? "ffmpeg",
      encodeConfig["sox"],
      (entry) => {
        this.handleEncodeComplete(entry);
      }
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
          ).map((entry) => {
            return entry.format(false);
          });
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
          .map((entry) => {
            return entry.format();
          });
        const result = await Promise.all(list);
        res.send(result);
      } catch (e) {
        console.error(e);
        res.status(400).send({ error: e.message });
      }
    });
    this.listener = this.server.listen(
      serverConfig["port"] ?? 0,
      "0.0.0.0",
      () => {
        this.handleReady();
      }
    );
  }

  async getMVWithId(id) {
    const source = id.split(".")[0];
    const mv = await this.mvProviders
      .find((provider) => provider.name() == source)
      .get(id);
    return mv;
  }

  async getLyricsWithId(id) {
    const source = id.split(".")[0];
    const lyrics = await this.lyricsProviders
      .find((provider) => provider.name() == source)
      .get(id);
    return lyrics;
  }

  handleDownloadComplete(entry) {
    this.encoder.add(entry);
  }

  handleEncodeComplete(entry) {
    this.player.add(entry);
  }

  handleReady() {
    if (this && this.listener) {
      this.readyCallback(internalIpV4Sync(), this.listener.address().port);
    }
  }

  handlePlayerEnded() {
    this.player.next();
  }
}

export default Server;
