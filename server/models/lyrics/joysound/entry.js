import { Result } from "antd";
import iconv from "iconv-lite";
import fetch from "node-fetch";

import { Line, Style, Word } from "../common";

const NAME = "joysound";

class Pointer {
  i;

  constructor(i) {
    this.i = i ?? 0;
  }

  advance = (i) => {
    this.i += i;
    return this.i - i;
  };

  current = () => {
    return this.i;
  };
}

class Entry {
  selSongNo;
  songName;
  artistName;

  constructor(selSongNo, songName, artistName) {
    this.selSongNo = selSongNo;
    this.songName = songName;
    this.artistName = artistName;
  }

  id = () => {
    return `${this.source()}.${this.selSongNo}`;
  };

  title = () => {
    return this.songName;
  };

  artist = () => {
    return this.artistName;
  };

  style = () => {
    return Style.Karaoke;
  };

  source = () => {
    return NAME;
  };

  format = async (withLyrics) => {
    return {
      id: this.id(),
      title: this.songName,
      artist: this.artistName,
      style: this.style(),
      lyrics: withLyrics ? await this.lyrics() : "",
    };
  };

  lyrics = async () => {
    const rawLyrics = await this.rawLyrics();

    let lines = [];
    for (const line of rawLyrics["lyrics"]) {
      lines.push(line.join(""));
    }
    return lines.join("\n");
  };

  formattedLyrics = async () => {
    const rawLyrics = await this.rawLyrics();
  };

  rawLyrics = async () => {
    const res = await fetch("https://karaplus-ss.joysound.com/Karaoke/GetFME", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-AppId": "0000300",
        "X-OSName": "iOS",
        "X-AuthFlag": "0",
        "X-Pwd": "",
        "X-OSVer": "15.4",
        "X-JsId": "",
        "X-UUID": "bc78bca8-58b8-433d-a507-c34491994fb6",
        "X-AppVer": "3.2.9",
      },
      body: new URLSearchParams({
        service_type: "003000951",
        slc: this.selSongNo,
        contents_type: 4,
        // TODO: change to 3 on release
        mode: 0,
        api_ver: 6,
        play_type: 1,
      }),
    });
    const json = await res.json();

    const fme = json["fme"];
    const bin = Buffer.from(fme, "base64");
    const lyricsOffset = bin.readUInt32LE(10);
    const timingOffset = bin.readUInt32LE(14);

    // Parse lyrics.
    let lyrics = [];
    let pointer = new Pointer(lyricsOffset);
    // These 30 bytes represent colors.
    pointer.advance(30);
    while (pointer.current() < timingOffset) {
      // These 12 bytes represent size, flags, positions and styles.
      pointer.advance(12);

      // Parse characters.
      let characters = [];
      const count = bin.readUint16LE(pointer.advance(2));
      for (let i = 0; i < count; i++) {
        // This byte represents font.
        pointer.advance(1);
        const charSlice = bin
          .slice(pointer.advance(2), pointer.current())
          .reverse();
        const char = iconv.decode(charSlice, "SHIFT_JIS");
        characters.push(char.replace("\x00", ""));
        // These bytes represents width.
        pointer.advance(2);
      }
      lyrics.push(characters);

      // TODO: Parse furiganas.
      const fc = bin.readUint16LE(pointer.advance(2));
      for (let i = 0; i < fc; i++) {
        const length = bin.readUInt8(pointer.advance(2));
        // These bytes represents position.
        pointer.advance(2);
        // These bytes represents furiganas.
        pointer.advance(2 * length);
      }
    }

    // Parse timing.
    let timing = [];
    pointer = new Pointer(timingOffset);
    while (pointer.current() < bin.length) {
      const time = bin.readUint32LE(pointer.advance(4));

      // Parse payloads.
      const size = bin.readUInt8(pointer.advance(1));
      let payload = [];
      for (let i = 0; i < size; i++) {
        const p = bin.readUInt8(pointer.advance(1));
        payload.push(p);
      }
      timing.push({ time: time, payload: payload });
    }

    return {
      lyrics: lyrics,
      timing: timing,
    };
  };
}

export { NAME };
export default Entry;
