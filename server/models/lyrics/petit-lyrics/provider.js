import fetch from "node-fetch";
import { parseStringPromise as parseXMLString } from "xml2js";
import Entry, { NAME } from "./entry";

class Provider {
  name() {
    return NAME;
  }

  configure(_config) {}

  async searchByTitle(title) {
    return this.searchByTitleAndArtist(title, "");
  }

  async searchByTitleAndArtist(title, artist) {
    const res = await fetch(
      "https://p1.petitlyrics.com/api/GetPetitLyricsData.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          maxCount: 100,
          key_title: title,
          key_artist: artist,
          terminalType: 4,
          clientAppId: "p1232089",
        }),
      }
    );
    const text = await parseXMLString(await res.text());

    let result = [];
    const songs = text["response"]["songs"][0]["song"];
    for (const song of songs) {
      result.push(
        new Entry(
          parseInt(song["lyricsId"][0]),
          song["title"][0],
          song["artist"][0],
          parseInt(song["availableLyricsType"][0])
        )
      );
    }
    return result.filter((lyrics) => lyrics.isSync());
  }

  async get(id) {
    const lyricsId = id.split(".")[1];
    const res = await fetch(
      "https://p1.petitlyrics.com/api/GetPetitLyricsData.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          key_lyricsId: lyricsId,
          terminalType: 4,
          clientAppId: "p1232089",
        }),
      }
    );
    const text = await parseXMLString(await res.text());

    const song = text["response"]["songs"][0]["song"][0];
    return new Entry(
      parseInt(song["lyricsId"][0]),
      song["title"][0],
      song["artist"][0],
      parseInt(song["availableLyricsType"][0])
    );
  }
}

export default Provider;
