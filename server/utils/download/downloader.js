import fs from "fs";
import YTDlpWrap from "yt-dlp-wrap";
import Entry from "../common/entry";

class Downloader {
  location_;
  ytDlp;
  complete;

  downloading = false;
  list_ = [];

  constructor(location, ytDlpLocation, complete) {
    this.location_ = location;
    // Creates a directory if it does not exist in advance.
    fs.mkdirSync(location, {
      recursive: true,
    });
    this.ytDlp = new YTDlpWrap(ytDlpLocation);
    this.complete = complete;
  }

  location() {
    return this.location_;
  }

  list() {
    return this.list_;
  }

  add(mv, lyrics) {
    const mvPath = `${this.location_}/${mv.id()}.mp4`;
    const lyricsPath = `${this.location_}/${lyrics.id()}.ass`;
    this.list_.push(new Entry(mv, mvPath, lyrics, lyricsPath));
    this.download();
  }

  remove(sequence) {
    const i = list.findIndex((entry) => entry.sequence() == sequence);
    if (i >= 0 && list[i].isRemovable()) {
      this.list_.splice(i);
    }
  }

  async download() {
    if (this.downloading) {
      return;
    }

    const i = this.list_.findIndex((entry) => entry.isDownloadable());
    if (i < 0) {
      return;
    }
    let entry = this.list_[i];

    // Download lyrics
    this.downloading = true;
    entry.onDownload();
    const lyrics = entry.lyrics();
    const lyricsPath = `${this.location_}/${lyrics.id()}.ass`;
    if (!fs.existsSync(lyricsPath)) {
      try {
        fs.writeFileSync(lyricsPath, await lyrics.formattedLyrics());
      } catch (e) {
        // Clean up
        if (fs.existsSync(lyricsPath)) {
          fs.rmSync(lyricsPath);
        }

        entry.onFail(e.message);
        this.downloading = false;
        this.download();
        return;
      }
    }

    // Download MV
    const mv = entry.mv();
    const mvPath = `${this.location_}/${mv.id()}.mp4`;
    if (!fs.existsSync(mvPath)) {
      try {
        await this.ytDlp.execPromise(
          [mv.url(), "-o", mvPath].concat(mv.format())
        );
      } catch (e) {
        // Clean up
        if (fs.existsSync(mvPath)) {
          fs.rmSync(mvPath);
        }

        entry.onFail(e.message);
        this.downloading = false;
        this.download();
        return;
      }
    }

    entry.onComplete();
    this.complete(entry);
    this.list_.splice(i);
    this.downloading = false;
    this.download();
  }
}

export default Downloader;
