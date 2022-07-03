import fetch from "node-fetch";
import Entry, { NAME } from "./entry";

class Provider {
  key;

  name() {
    return NAME;
  }

  configure(config) {
    this.key = config.key;
  }

  async search(title) {
    const res = await fetch(
      `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=${title}&type=video&key=${this.key}`
    );
    const json = await res.json();

    let result = [];
    const items = json["items"];
    for (const item of items) {
      const snippet = item["snippet"];
      result.push(
        new Entry(
          item["id"]["videoId"],
          snippet["title"],
          snippet["channelTitle"]
        )
      );
    }
    return result;
  }

  async get(id) {
    const videoId = id.split(".")[1];
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${this.key}`
    );
    const json = await res.json();

    const snippet = json["items"][0]["snippet"];
    return new Entry(videoId, snippet["title"], snippet["channelTitle"]);
  }
}

export default Provider;
