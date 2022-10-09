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
      result.push(line.split("]", 2)[1]);
    }
    return result.join("\n");
  };

  formattedLyrics = async () => {
    const rawLyrics = await this.rawLyrics();

    let result = [];
    let prevStartTime = -1;
    let prevLine = "";
    for (const line of rawLyrics) {
      if (!line) {
        continue;
      }
      const splits = line.split("]", 2);
      const timeString = splits[0].split("[")[1];
      const timeComponents = timeString.split(":");
      const time = timeComponents.reduce(
        (prev, current) => prev * 60 + parseFloat(current)
      );
      if (prevStartTime >= 0) {
        result.push(new Line(prevLine, prevStartTime, time));
      }
      prevStartTime = time;
      prevLine = splits[1];
    }
    result.push(new Line(prevLine, prevStartTime, 35999.99));
    return result;
  };

  rawLyrics = async () => {
    const res = await fetch(
      `https://music.xianqiao.wang/neteaseapiv2/lyric?id=${this.id_}`
    );
    const json = await res.json();

    return json["lrc"]["lyric"].split("\n");
  };
}

export { NAME };
export default Entry;
