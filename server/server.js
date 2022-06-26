import express from "express";
import fs from "fs";
import BilibiliMVProvider from "./models/mv/bilibili/provider";
import YoutubeMVProvider from "./models/mv/youtube/provider";
import PetitLyricsLyricsProvider from "./models/lyrics/petit-lyrics/provider";
import Entry, { Status } from "./utils/common/entry";
import Downloader from "./utils/download/downloader";

class Server {
  config;
  mv_providers = [new BilibiliMVProvider(), new YoutubeMVProvider()];
  lyrics_providers = [new PetitLyricsLyricsProvider()];
  playlist = [];
  downloader;

  server = express();
  listener;

  constructor() {
    // Read config from config.json.
    const rawConfig = fs.readFileSync("config.json");
    this.config = JSON.parse(rawConfig);

    // Configure providers.
    const providersConfig = this.config["providers"] ?? {};
    const mvConfig = providersConfig["mv"] ?? {};
    for (let provider of this.mv_providers) {
      provider.configure(mvConfig[provider.name()] ?? {});
    }
    const lyricsConfig = providersConfig["lyrics"] ?? {};
    for (let provider of this.lyrics_providers) {
      provider.configure(lyricsConfig[provider.name()] ?? {});
    }

    // Setup downloader.
    const downloadConfig = this.config["download"] ?? {};
    this.downloader = new Downloader(
      downloadConfig["location"] ?? "./cache",
      downloadConfig["yt-dlp" ?? "yt-dlp"]
    );

    // Setup server.
    const serverConfig = this.config["server"] ?? {};
    this.server.get("/connect", (_req, res) => {
      res.send({
        mv: this.mv_providers.map((provider) => provider.name()),
        lyrics: this.lyrics_providers.map((provider) => provider.name()),
      });
    });
    this.server.get("/search", async (req, res) => {
      try {
        let result = {};
        const title = req.query["title"];
        const mv = req.query["mv"];
        if (mv) {
          result["mv"] = (
            await this.mv_providers
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
            await this.lyrics_providers
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
        const mv = await this.mv_providers
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
        const lyrics = await this.lyrics_providers
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
        const mv = await this.mv_providers
          .find((provider) => provider.name() == mvSource)
          .get(mvId);
        const lyricsId = req.query["lyrics"];
        const lyricsSource = lyricsId.split(".")[0];
        const lyrics = await this.lyrics_providers
          .find((provider) => provider.name() == lyricsSource)
          .get(lyricsId);
        const entry = new Entry(mv, lyrics);
        this.playlist.push(entry);
        this.requestDownload();
        res.send({
          sequence: entry.sequence(),
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
        });
      } catch (e) {
        console.error(e);
        res.status(400).send({ error: e.message });
      }
    });
    this.server.get("/playlist", async (_req, res) => {
      res.send(
        this.playlist.map((entry) => {
          const mv = entry.mv();
          const lyrics = entry.lyrics();
          return {
            sequence: entry.sequence(),
            status: entry.status(),
            progress: entry.progress(),
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
    this.listener = this.server.listen(serverConfig["port"] ?? 0, "0.0.0.0");
  }

  port = () => {
    return this.listener.address().port;
  };

  requestDownload = () => {
    const entry = this.playlist.find(
      (entry) => entry.status() == Status.DownloadQueue
    );
    if (entry) {
      this.downloader.download(entry, (_success) => {
        this.requestDownload();
      });
    }
  };
}

export default Server;
