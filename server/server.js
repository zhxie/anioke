import express from "express";
import fs from "fs";
import BilibiliMVProvider from "./models/mv/bilibili/provider";
import YoutubeMVProvider from "./models/mv/youtube/provider";
import PetitLyricsLyricsProvider from "./models/lyrics/petit-lyrics/provider";

class Server {
  config;
  mv_providers = [new BilibiliMVProvider(), new YoutubeMVProvider()];
  lyrics_providers = [new PetitLyricsLyricsProvider()];
  download_manager = [];

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
            };
          });
        }
        const artist = req.query["artist"];
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
      } catch {
        res.status(400).send();
      }
    });
    this.server.get("/order", async (req, res) => {
      try {
        let result = {};
        const mvId = req.query["mv"];
        const mvSource = mvId.split(".")[0];
        result["mv"] = await this.mv_providers
          .find((provider) => provider.name() == mvSource)
          .get(mvId);
        const lyricsId = req.query["lyrics"];
        const lyricsSource = lyricsId.split(".")[0];
        result["lyrics"] = await this.lyrics_providers
          .find((provider) => provider.name() == lyricsSource)
          .get(lyricsId);
        this.download_manager.push(result);
        res.status(200).send();
      } catch {
        res.status(400).send();
      }
    });
    this.listener = this.server.listen(serverConfig["port"] ?? 0, "0.0.0.0");
  }

  port = () => {
    return this.listener.address().port;
  };
}

export default Server;
