import fs from "fs";
import YTDlpWrap from "yt-dlp-wrap";
import Entry from "./entry";

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
        fs.writeFileSync(
          lyricsPath,
          JSON.stringify(await lyrics.formattedLyrics())
        );
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
