import fetch from "node-fetch";
import Entry, { NAME } from "./entry";

class Provider {
  name = () => {
    return NAME;
  };

  configure = (_config) => {};

  search = async (title) => {
    const res = await fetch(
      `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${title}`
    );
    const json = await res.json();

    let result = [];
    const r = json["data"]["result"];
    for (const ele of r) {
      const bvid = ele["bvid"];
      const res2 = await fetch(
        `http://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
      );
      const json2 = await res2.json();

      const data = json2["data"];
      const pages = data["pages"];
      for (const page of pages) {
        result.push(
          new Entry(
            ele["author"],
            bvid,
            data["title"],
            "http:" + ele["pic"],
            ele["upic"],
            page["page"],
            page["part"]
          )
        );
      }
    }
    return result;
  };

  get = async (id) => {
    const splits = id.split(".");
    const bvid = splits[1];
    const page = splits[2];
    const res = await fetch(
      `http://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
    );
    const json = await res.json();

    const data = json["data"];
    const owner = data["owner"];
    return new Entry(
      owner["name"],
      bvid,
      data["title"],
      data["pic"],
      owner["face"],
      page,
      data["pages"][page - 1]["part"]
    );
  };
}

export default Provider;
