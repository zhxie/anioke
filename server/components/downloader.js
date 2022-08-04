import fs from "fs";
import YTDlpWrap from "yt-dlp-wrap";
import Entry from "./entry";
import { padStart } from "../utils";

const compileLyricsWord = (word) => {
  const duration = Math.round((word["endTime"] - word["startTime"]) * 100);
  return `{\\K${duration}}${word["word"]}`;
};

const convertTime = (time) => {
  const hour = parseInt(String(time / 3600));
  const min = parseInt(String((time - 3600 * hour) / 60));
  const sec = parseInt(String(time - 3600 * hour - 60 * min));
  const mil = Math.min(
    Math.round((time - 3600 * hour - 60 * min - sec) * 100),
    99
  );
  return `${hour}:${padStart(min, 2)}:${padStart(sec, 2)}.${padStart(mil, 2)}`;
};

const compileLyricsLine = (line, style, assStyle, advance, delay) => {
  let words = line["line"];
  switch (style) {
    case Style.Traditional:
      break;
    case Style.Karaoke:
      words = `{\\K${Math.round(advance * 100)}}`;
      words += line["words"].map(compileLyricsWord).join("");
      break;
    default:
      throw new Error(`unexpected style "${style}"`);
  }
  return `Dialogue: 0,${convertTime(line["startTime"] - advance)},${convertTime(
    line["endTime"] + delay
  )},${assStyle},,0,0,0,,${words}`;
};

const compileLyrics = (lines, style) => {
  const ASS_STYLES = ["K1", "K2"];
  const ADVANCE = 5;
  const DELAY = 1;

  let result = [];
  let displays = new Array(ASS_STYLES.length).fill(0);
  for (const line of lines) {
    if (line.isEmpty()) {
      continue;
    }

    // Calculate lyrics show in advance time.
    let newParagraph = false;
    const lastEndTime = Math.max(...displays);
    if (lastEndTime < line.startTime - 5) {
      // Assert there is a new paragraph since there are more than `ADVANCE`
      // seconds blank.
      newParagraph = true;
    }

    const priorEndTime = Math.min(...displays);
    let index = displays.indexOf(priorEndTime);
    if (newParagraph) {
      index = 0;
    }
    let advance = Math.max(line.startTime - priorEndTime, 0);
    if (newParagraph) {
      advance = Math.min(advance, ADVANCE);
    }

    const assStyle = ASS_STYLES[index];
    result.push(compileLyricsLine(line, style, assStyle, advance, DELAY));

    if (newParagraph) {
      displays.fill(line.startTime - advance);
    }
    displays[index] = line.endTime + DELAY;
  }
  return result.join("\n");
};

class Downloader {
  ytDlp;
  ffmpegPath;
  location;
  onComplete;

  downloading = false;
  list_ = [];

  constructor(ytDlpPath, ffmpegPath, location, onComplete) {
    this.ytDlp = new YTDlpWrap(ytDlpPath);
    this.ffmpegPath = ffmpegPath;
    this.location = location;
    // Creates a directory if it does not exist in advance.
    fs.mkdirSync(location, {
      recursive: true,
    });
    this.onComplete = onComplete;
  }

  list = () => {
    return this.list_;
  };

  add = (mv, lyrics) => {
    const mvPath = `${this.location}/${mv.id()}.mp4`;
    const lyricsPath = `${this.location}/${lyrics.id()}.ass`;
    const entry = new Entry(mv, mvPath, lyrics, lyricsPath);
    this.addEntry(entry);
  };

  addEntry = (entry) => {
    entry.onDownloadQueue();
    this.list_.push(entry);
    this.download();
  };

  remove = (sequence) => {
    const i = this.list_.findIndex((entry) => entry.sequence() === sequence);
    if (i >= 0 && this.list_[i].isRemovable()) {
      this.list_.splice(i, 1);
    }

    this.download();
  };

  retry = (sequence) => {
    const i = this.list_.findIndex((entry) => entry.sequence() === sequence);
    if (i >= 0) {
      let entry = this.list_[i];
      if (entry.isFailed()) {
        this.list_.splice(i, 1);
        this.addEntry(entry);
      }
    }

    this.download();
  };

  download = async () => {
    if (this.downloading) {
      return;
    }

    const i = this.list_.findIndex((entry) => entry.isDownloadQueued());
    if (i < 0) {
      return;
    }
    let entry = this.list_[i];

    // Download lyrics.
    this.downloading = true;
    entry.onDownload();
    const lyrics = entry.lyrics();
    const lyricsPath = `${this.location}/${lyrics.id()}.json`;
    if (!fs.existsSync(lyricsPath)) {
      try {
        fs.writeFileSync(lyricsPath, await lyrics.formattedLyrics());
      } catch (e) {
        console.error(e);
        // Clean up.
        if (fs.existsSync(lyricsPath)) {
          fs.rmSync(lyricsPath);
        }

        entry.onFail(e.message);
        this.downloading = false;
        this.download();
        return;
      }
    }

    // Compile lyrics.
    // TODO: Lyrics compilation should be done in lyrics-related component.
    const compiledLyricsPath = `${this.location}/${lyrics.id()}.ass`;
    const lyricsJSON = fs.readFileSync(lyricsPath);
    const lines = JSON.parse(lyricsJSON);
    fs.writeFileSync(compiledLyricsPath, compileLyrics(lines, lyrics.style()));

    // Download MV.
    const mv = entry.mv();
    const mvPath = `${this.location}/${mv.id()}.mp4`;
    if (!fs.existsSync(mvPath)) {
      try {
        await this.ytDlp.execPromise(
          [mv.url(), "--ffmpeg-location", this.ffmpegPath, "-o", mvPath].concat(
            mv.downloadOptions()
          )
        );
      } catch (e) {
        console.error(e);
        // Clean up.
        if (fs.existsSync(mvPath)) {
          fs.rmSync(mvPath);
        }

        entry.onFail(e.message);
        this.downloading = false;
        this.download();
        return;
      }
    }

    this.onComplete(entry);
    this.list_.splice(i, 1);
    this.downloading = false;
    this.download();
  };
}

export default Downloader;
