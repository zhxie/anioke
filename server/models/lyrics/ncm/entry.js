import { Lrc } from "lrc-kit";
import fetch from "node-fetch";
import { Line, Style } from "../common";

const NAME = "ncm";

class Entry {
  id_;
  name;
  artist_;

  constructor(id, name, artist) {
    this.id_ = id;
    this.name = name;
    this.artist_ = artist;
  }

  id = () => {
    return `${this.source()}.${this.id_}`;
  };

  title = () => {
    return this.name;
  };

  artist = () => {
    return this.artist_;
  };

  style = () => {
    return Style.Traditional;
  };

  source = () => {
    return NAME;
  };

  format = async (withLyrics) => {
    return {
      id: this.id(),
      title: this.name,
      artist: this.artist_,
      style: this.style(),
      lyrics: withLyrics ? await this.lyrics() : "",
    };
  };

  lyrics = async () => {
    const rawLyrics = await this.rawLyrics();

    let result = [];
    for (const line of rawLyrics) {
      result.push(line.line);
    }
    return result.join("\n");
  };

  formattedLyrics = async () => {
    const rawLyrics = await this.rawLyrics();

    let result = [];
    let prevTime = -1;
    let prevLine = "";
    for (const line of rawLyrics) {
      if (!line) {
        continue;
      }
      if (prevTime >= 0) {
        result.push(new Line(prevLine, prevTime, line.time));
      }
      prevTime = line.time;
      prevLine = line.line;
    }
    result.push(new Line(prevLine, prevTime, 35999.99));
    return result;
  };

  rawLyrics = async () => {
    const res = await fetch(
      `https://music.xianqiao.wang/neteaseapiv2/lyric?id=${this.id_}`
    );
    const json = await res.json();

    const lyrics = Lrc.parse(json["lrc"]["lyric"]);
    return lyrics.lyrics
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((lyric) => {
        return { time: lyric.timestamp, line: lyric.content };
      });
  };
}

export { NAME };
export default Entry;
