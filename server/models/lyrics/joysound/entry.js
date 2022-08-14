import iconv from "iconv-lite";
import fetch from "node-fetch";

import { Point, Pointer, Polyline } from "../../../utils";
import { Line, Style, Word } from "../common";

const NAME = "joysound";

const EventId = {
  Start: 0x0,
  SetSpeed: 0x1,
  Start2: 0xc,
  SetSpeed2: 0xd,
};

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
    for (const line of rawLyrics.lyrics) {
      lines.push(line.chars.map((char) => char.char).join(""));
    }
    return lines.join("\n");
  };

  formattedLyrics = async () => {
    const rawLyrics = await this.rawLyrics();

    // Calculate ticks from start time and speed.
    let lyricsTicks = [];
    let lineTicks = [];
    let time = 0;
    let speed = 0;
    let pos = 0;
    const events = rawLyrics.timing;
    for (const event of events) {
      const nextTime = event.time / 1000;
      const eventId = event.payload[0];
      switch (eventId) {
        case EventId.Start:
          // Calculate remaining time in the last line.
          pos = (nextTime - time) * speed + pos;
          time = nextTime;
          speed = event.payload[1] * 10;
          if (lineTicks.length > 0) {
            lineTicks.push({ time: time, pos: pos });
            lyricsTicks.push(lineTicks);
            lineTicks = [];
          }
          // Start of the next line.
          pos = 0;
          lineTicks.push({ time: time, pos: pos });
          break;
        case EventId.SetSpeed:
          pos = (nextTime - time) * speed + pos;
          time = nextTime;
          speed = event.payload[1] * 10;
          lineTicks.push({ time: time, pos: pos });
          break;
        case EventId.Start2:
        case EventId.SetSpeed2:
          throw new Error(`unsupported event id "${eventId}"`);
        default:
          break;
      }
    }
    if (lineTicks.length > 0) {
      lyricsTicks.push(lineTicks);
    }

    // Match lyrics with ticks.
    let result = [];
    const lyrics = rawLyrics.lyrics;
    for (let i = 0; i < lyrics.length; i++) {
      const line = lyrics[i];
      const chars = line.chars;
      const lineTicks = lyricsTicks[i];

      // Line.
      let startTime = lineTicks[0].time;
      let l = new Line(chars.map((char) => char.char).join(""), startTime, 0);
      let polyline = new Polyline(
        lineTicks.map((tick) => {
          return new Point(tick.time, tick.pos);
        })
      );
      let width = 0;
      for (const char of chars) {
        width += char.width;
        const endTime = polyline.crossByY(width).x();
        l.words.push(new Word(char.char, startTime, endTime));
        startTime = endTime;
      }
      l.endTime = startTime;
      result.push(l);
    }

    return result;
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
        mode: 3,
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
      // These 12 bytes represent size.
      pointer.advance(2);
      const flags = bin.readUint16LE(pointer.advance(2));
      const xPos = bin.readUint16LE(pointer.advance(2));
      const yPos = bin.readUint16LE(pointer.advance(2));
      // These 4 bytes represent styles.
      pointer.advance(4);

      // Parse characters.
      let chars = [];
      const count = bin.readUint16LE(pointer.advance(2));
      for (let i = 0; i < count; i++) {
        // This byte represents font.
        pointer.advance(1);
        const charSlice = bin
          .slice(pointer.advance(2), pointer.current())
          .reverse();
        const char = iconv.decode(charSlice, "SHIFT_JIS");
        const width = bin.readUint16LE(pointer.advance(2));
        chars.push({
          char: char.replace("\x00", ""),
          width: width,
        });
      }

      // Parse furiganas.
      let furis = [];
      const fc = bin.readUint16LE(pointer.advance(2));
      for (let i = 0; i < fc; i++) {
        const length = bin.readUInt8(pointer.advance(2));
        const xPos = bin.readUint16LE(pointer.advance(2));
        let chars = "";
        for (let j = 0; j < length; j++) {
          const charSlice = bin
            .slice(pointer.advance(2), pointer.current())
            .reverse();
          const char = iconv.decode(charSlice, "SHIFT_JIS");
          chars += char;
        }
        furis.push({ xPos: xPos, chars: chars });
      }
      lyrics.push({
        flags: flags,
        xPos: xPos,
        yPos: yPos,
        chars: chars,
        furis: furis,
      });
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
