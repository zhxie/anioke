import fetch from "node-fetch";
import Entry, { NAME } from "./entry";

class Provider {
  name = () => {
    return NAME;
  };

  configure = (_config) => {};

  searchByTitle = async (title) => {
    const res = await fetch(
      `https://music.xianqiao.wang/neteaseapiv2/search?limit=10&type=1&keywords=${title}`
    );
    const json = await res.json();

    let result = [];
    const songs = json["result"]["songs"];
    for (const song of songs) {
      const id = song["id"];
      const res2 = await fetch(
        `https://music.xianqiao.wang/neteaseapiv2/lyric?id=${id}`
      );
      const json2 = await res2.json();

      if (json2["lrc"]["lyric"].includes("纯音乐，请欣赏")) {
        continue;
      }
      result.push(new Entry(id, song["name"], song["artists"][0]["name"]));
    }
    return result;
  };

  searchByTitleAndArtist = async (title, artist) => {
    return this.searchByTitle(`${title} ${artist}`);
  };

  get = async (id) => {
    const lyricsId = id.split(".")[1];
    const res = await fetch(
      `https://music.xianqiao.wang/neteaseapiv2/song/detail?ids=${lyricsId}`
    );
    const json = await res.json();

    const song = json["songs"][0];
    return new Entry(song["id"], song["name"], song["ar"][0]["name"]);
  };
}

export default Provider;
