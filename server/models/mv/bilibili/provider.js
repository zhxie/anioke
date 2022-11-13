import fetch from "node-fetch";
import Entry, { NAME } from "./entry";

class Provider {
  cookie;

  _initCookie = async () => {
    const res = await fetch(`https://www.bilibili.com`, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
      },
    });
    const cookieList = res.headers.raw()["set-cookie"];
    this.cookie = cookieList.map((item) => item.split(";")[0]).join(";");
  };

  name = () => {
    return NAME;
  };

  configure = (config) => {
    this.cookiesPath = config.cookiesPath;
  };

  search = async (title) => {
    if (!this.cookie) {
      await this._initCookie();
    }
    const res = await fetch(
      `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${title}`,
      {
        headers: {
          cookie: this.cookie,
        },
      }
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
        let part = page["part"];
        if (pages.length === 1) {
          part = "";
        }
        result.push(
          new Entry(
            ele["author"],
            bvid,
            data["title"],
            "http:" + ele["pic"],
            ele["upic"],
            page["page"],
            part,
            this.cookiesPath
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
    const pages = data["pages"];
    let part = pages[page - 1]["part"];
    if (pages.length === 1) {
      part = "";
    }
    return new Entry(
      owner["name"],
      bvid,
      data["title"],
      data["pic"],
      owner["face"],
      page,
      part,
      this.cookiesPath
    );
  };
}

export default Provider;
