import fetch from "node-fetch";
import Entry, { NAME } from "./entry";

const best = (thumbnails) => {
  const priorities = ["maxres", "standard", "high", "medium", "default"];
  for (let key of priorities) {
    if (thumbnails[key]) {
      return thumbnails[key].url;
    }
  }
  throw new Error(`unexpected thumbnails`);
};

class Provider {
  key;

  name = () => {
    return NAME;
  };

  configure = (config) => {
    this.key = config.key;
  };

  search = async (title) => {
    const res = await fetch(
      `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&q=${title}&type=video&key=${this.key}`
    );
    const json = await res.json();

    let result = [];
    let channelIds = new Set();
    const items = json["items"];
    for (const item of items) {
      const snippet = item["snippet"];
      const channelId = snippet["channelId"];
      channelIds.add(channelId);
      result.push({
        videoId: item["id"]["videoId"],
        title: snippet["title"],
        thumbnail: best(snippet["thumbnails"]),
        channelTitle: snippet["channelTitle"],
        channelId: channelId,
      });
    }

    const res2 = await fetch(
      `https://youtube.googleapis.com/youtube/v3/channels?part=snippet&id=${Array.from(
        channelIds
      ).join()}&key=${this.key}`
    );
    const json2 = await res2.json();

    let channelThumbnails = new Map();
    json2["items"].forEach((value) => {
      channelThumbnails.set(value["id"], best(value["snippet"]["thumbnails"]));
    });
    return result.map((value) => {
      return new Entry(
        value.videoId,
        value.title,
        value.thumbnail,
        value.channelTitle,
        channelThumbnails.get(value.channelId)
      );
    });
  };

  get = async (id) => {
    const videoId = id.split(".")[1];
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${this.key}`
    );
    const json = await res.json();

    const snippet = json["items"][0]["snippet"];
    const res2 = await fetch(
      `https://youtube.googleapis.com/youtube/v3/channels?part=snippet&id=${snippet["channelId"]}&key=${this.key}`
    );
    const json2 = await res2.json();

    return new Entry(
      videoId,
      snippet["title"],
      best(snippet["thumbnails"]),
      snippet["channelTitle"],
      best(json2["items"][0]["snippet"]["thumbnails"])
    );
  };
}

export default Provider;
