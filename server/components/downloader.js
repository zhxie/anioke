import fs from "fs";
import YTDlpWrap from "yt-dlp-wrap";
import Entry from "./entry";

class Downloader {
  location;
  ytDlp;
  completeCallback;

  downloading = false;
  list_ = [];

  constructor(location, ytDlpLocation, onComplete) {
    this.location = location;
    // Creates a directory if it does not exist in advance.
    fs.mkdirSync(location, {
      recursive: true,
    });
    this.ytDlp = new YTDlpWrap(ytDlpLocation);
    this.completeCallback = onComplete;
  }

  list = () => {
    return this.list_;
  };

  add = (mv, lyrics) => {
    const mvPath = `${this.location}/${mv.id()}.mp4`;
    const lyricsPath = `${this.location}/${lyrics.id()}.ass`;
    let entry = new Entry(mv, mvPath, lyrics, lyricsPath);
    entry.onDownloadQueue();
    this.list_.push(entry);
    this.download();
  };

  remove = (sequence) => {
    const i = this.list_.findIndex((entry) => entry.sequence() == sequence);
    if (i >= 0 && this.list_[i].isRemovable()) {
      this.list_.splice(i, 1);
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
    const lyricsPath = `${this.location}/${lyrics.id()}.ass`;
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

    // Download MV.
    const mv = entry.mv();
    const mvPath = `${this.location}/${mv.id()}.mp4`;
    if (!fs.existsSync(mvPath)) {
      try {
        await this.ytDlp.execPromise(
          [mv.url(), "-o", mvPath].concat(mv.downloadOptions())
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

    this.completeCallback(entry);
    this.list_.splice(i, 1);
    this.downloading = false;
    this.download();
  };
}

export default Downloader;
