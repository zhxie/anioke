import fetch from "node-fetch";
import Entry, { NAME } from "./entry";

class Provider {
  name = () => {
    return NAME;
  };

  configure = (_config) => {};

  searchByTitle = async (title) => {
    const res = await fetch(
      "https://karaplus-mspxy.joysound.com/Common/ContentsList?" +
        new URLSearchParams({
          sort: "popular",
          match1: "partial",
          format: "all",
          order: "desc",
          word1: title,
          kind1: "song",
          apiVer: 1,
          kindCnt: 1,
        }),
      {
        method: "POST",
        headers: {
          "X-JSP-APP-NAME": "0000300",
        },
      }
    );
    const json = await res.json();

    let result = [];
    const contentsList = json["contentsList"];
    for (const content of contentsList) {
      result.push(
        new Entry(
          parseInt(content["selSongNo"]),
          content["songName"],
          content["artistName"]
        )
      );
    }
    return result;
  };

  searchByTitleAndArtist = async (title, _artist) => {
    return this.searchByTitle(title);
  };

  get = async (id) => {
    const lyricsId = id.split(".")[1];
    const res = await fetch(
      "https://karaplus-mspxy.joysound.com/Common/ContentsDetail?" +
        new URLSearchParams({
          selSongNo: lyricsId,
          apiVer: 1,
          kind: "selSongNo",
        }),
      {
        method: "POST",
        headers: {
          "X-JSP-APP-NAME": "0000300",
        },
      }
    );
    const json = await res.json();

    return new Entry(
      parseInt(json["selSongNo"]),
      json["songName"],
      json["artistInfo"]["artistName"]
    );
  };
}

export default Provider;
