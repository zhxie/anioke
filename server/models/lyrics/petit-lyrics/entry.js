import fetch from "node-fetch";
import { parseStringPromise as parseXMLString } from "xml2js";
import { Line, Style, Word } from "../common";
import { compile, header } from "../utils";

const NAME = "petit_lyrics";

const Type = {
  Text: 1,
  LineSync: 2,
  WordSync: 3,
};

class Entry {
  lyricsId;
  title_;
  artist_;
  availableLyricsType;

  constructor(lyricsId, title, artist, availableLyricsType) {
    this.lyricsId = lyricsId;
    this.title_ = title;
    this.artist_ = artist;
    this.availableLyricsType = availableLyricsType;
  }

  id = () => {
    return `${this.source()}.${this.lyricsId}`;
  };

  title = () => {
    return this.title_;
  };

  artist = () => {
    return this.artist_;
  };

  style = () => {
    switch (this.availableLyricsType) {
      case Type.LineSync:
        return Style.Traditional;
      case Type.WordSync:
        return Style.Karaoke;
      default:
        throw new Error(`unexpected type "${this.availableLyricsType}"`);
    }
  };

  source = () => {
    return NAME;
  };

  format = async (withLyrics) => {
    return {
      id: this.id(),
      title: this.title_,
      artist: this.artist_,
      style: this.style(),
      lyrics: withLyrics ? await this.lyrics() : "",
    };
  };

  lyrics = async () => {
    const rawLyrics = await this.rawLyrics();
    const text = await parseXMLString(rawLyrics);

    let result = [];
    const lines = text["wsy"]["line"];
    for (const line of lines) {
      result.push(line["linestring"][0]);
    }
    return result.join("\n");
  };

  formattedLyrics = async () => {
    const h = header(this.title_);
    const rawLyrics = await this.rawLyrics();
    const text = await parseXMLString(rawLyrics);

    const lines = text["wsy"]["line"];
    let ls = [];
    for (const line of lines) {
      let l = new Line(
        line["linestring"][0],
        parseInt(line["word"][0]["starttime"][0]) / 1000,
        parseInt(line["word"][line["word"].length - 1]["endtime"][0]) / 1000
      );
      for (const word of line["word"]) {
        const w = new Word(
          word["wordstring"][0],
          parseInt(word["starttime"][0]) / 1000,
          parseInt(word["endtime"][0]) / 1000
        );
        l.words.push(w);
      }
      ls.push(l);
    }
    const result = compile(this.style(), ls);
    return `${h}${result}`;
  };

  rawLyrics = async () => {
    const res = await fetch(
      "https://p1.petitlyrics.com/api/GetPetitLyricsData.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          key_lyricsId: this.lyricsId,
          lyricsType: 3,
          terminalType: 4,
          clientAppId: "p1232089",
        }),
      }
    );
    const text = await parseXMLString(await res.text());

    let lyrics = text["response"]["songs"][0]["song"][0]["lyricsData"][0];
    let result = decodeURIComponent(escape(atob(lyrics)));
    return result;
  };

  isSync = () => {
    switch (this.availableLyricsType) {
      case Type.Text:
        return false;
      case Type.LineSync:
      case Type.WordSync:
        return true;
      default:
        throw new Error(`unexpected type "${this.availableLyricsType}"`);
    }
  };
}

export { NAME };
export default Entry;
