import express from "express";
import fs from "fs";
import { internalIpV4Sync } from "internal-ip";
import BilibiliMVProvider from "./models/mv/bilibili/provider";
import YoutubeMVProvider from "./models/mv/youtube/provider";
import PetitLyricsLyricsProvider from "./models/lyrics/petit-lyrics/provider";
import Downloader from "./utils/download/downloader";
import Player from "./utils/play/player";

class Server {
  readyCallback;

  mvProviders = [new BilibiliMVProvider(), new YoutubeMVProvider()];
  lyricsProviders = [new PetitLyricsLyricsProvider()];
  downloader;
  player;
  server = express();
  listener;

  constructor(onReady, onPlay, onStop) {
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

    // Setup downloader.
    const downloadConfig = config["download"] ?? {};
    this.downloader = new Downloader(
      downloadConfig["location"] ?? "./cache",
      downloadConfig["yt-dlp" ?? "yt-dlp"],
      (entry) => {
        this.handleDownloadComplete(entry);
      }
    );

    // Setup player.
    this.player = new Player(onPlay, onStop);

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
        const mv = req.query["mv"];
        if (mv) {
          result["mv"] = (
            await this.mvProviders
              .find((provider) => provider.name() == mv)
              .search(title)
          ).map((entry) => {
            return {
              id: entry.id(),
              title: entry.title(),
              subtitle: entry.subtitle(),
              uploader: entry.uploader(),
              url: entry.url(),
            };
          });
        }
        const artist = req.query["artist"] ?? "";
        const lyrics = req.query["lyrics"];
        if (lyrics) {
          result["lyrics"] = (
            await this.lyricsProviders
              .find((provider) => provider.name() == lyrics)
              .searchByTitleAndArtist(title, artist)
          ).map((entry) => {
            return {
              id: entry.id(),
              title: entry.title(),
              artist: entry.artist(),
              style: entry.style(),
            };
          });
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
        const source = id.split(".")[0];
        const mv = await this.mvProviders
          .find((provider) => provider.name() == source)
          .get(id);
        res.send({
          id: id,
          title: mv.title(),
          subtitle: mv.subtitle(),
          uploader: mv.uploader(),
          url: mv.url(),
        });
      } catch (e) {
        console.error(e);
        res.status(400).send({ error: e.message });
      }
    });
    this.server.get("/lyrics", async (req, res) => {
      try {
        const id = req.query["id"];
        const source = id.split(".")[0];
        const lyrics = await this.lyricsProviders
          .find((provider) => provider.name() == source)
          .get(id);
        res.send({
          id: id,
          title: lyrics.title(),
          artist: lyrics.artist(),
          style: lyrics.style(),
          lyrics: await lyrics.lyrics(),
        });
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
        this.downloader.add(mv, lyrics);
        res.send({});
      } catch (e) {
        console.error(e);
        res.status(400).send({ error: e.message });
      }
    });
    this.server.get("/remove", (req, res) => {
      this.downloader.remove(req.query["sequence"]);
      this.player.remove(req.query["sequence"]);
      res.send({});
    });
    this.server.get("/playlist", (_req, res) => {
      res.send(
        this.player
          .list()
          .concat(this.downloader.list())
          .map((entry) => {
            const mv = entry.mv();
            const lyrics = entry.lyrics();
            return {
              sequence: entry.sequence(),
              status: entry.status(),
              error: entry.error(),
              mv: {
                id: mv.id(),
                title: mv.title(),
                subtitle: mv.subtitle(),
                uploader: mv.uploader(),
                url: mv.url(),
              },
              lyrics: {
                id: lyrics.id(),
                title: lyrics.title(),
                artist: lyrics.artist(),
                style: lyrics.style(),
              },
            };
          })
      );
    });
    this.listener = this.server.listen(
      serverConfig["port"] ?? 0,
      "0.0.0.0",
      () => {
        this.handleReady();
      }
    );
  }

  handleDownloadComplete(entry) {
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
