import fetch from "node-fetch";
import Entry, { NAME } from "./entry";

class Provider {
  name = () => {
    return NAME;
  };

  configure = (_config) => {};

  search = async (title) => {
    const res = await fetch(
      `https://music.xianqiao.wang/neteaseapiv2/search?limit=10&type=1&keywords=${title}`
    );
    const json = await res.json();

    let result = [];
    const songs = json["result"]["songs"];
    for (const song of songs) {
      const mvid = song["mvid"];
      if (!mvid) {
        continue;
      }

      const id = song["id"];
      const res2 = await fetch(
        `https://music.xianqiao.wang/neteaseapiv2/song/detail?ids=${id}`
      );
      const json2 = await res2.json();

      const artist = song["artists"][0];
      result.push(
        new Entry(
          id,
          song["name"],
          artist["name"],
          artist["img1v1Url"],
          song["album"]["name"],
          json2["songs"][0]["al"]["picUrl"],
          mvid
        )
      );
    }
    return result;
  };

  get = async (id) => {
    const splits = id.split(".");
    const mvId = splits[1];
    const res = await fetch(
      `https://music.xianqiao.wang/neteaseapiv2/song/detail?ids=${mvId}`
    );
    const json = await res.json();

    const song = json["songs"][0];
    const ar = song["ar"][0];
    const res2 = await fetch(
      `https://music.xianqiao.wang/neteaseapiv2/artist/detail?id=${ar["id"]}`
    );
    const json2 = await res2.json();

    const al = song["al"];
    return new Entry(
      mvId,
      song["name"],
      ar["name"],
      // TODO: It may be different with image in the searching result.
      json2["data"]["artist"]["cover"],
      al["name"],
      al["picUrl"],
      song["mv"]
    );
  };
}

export default Provider;
