import fs from "fs";
import YTDlpWrap from "yt-dlp-wrap";
import { Status } from "../common/entry";

class Downloader {
  location_;

  ytDlp;
  downloading = false;

  constructor(location, ytDlpLocation) {
    this.location_ = location;
    // Creates a directory if it does not exist in advance.
    fs.mkdirSync(location, {
      recursive: true,
    });
    this.ytDlp = new YTDlpWrap(ytDlpLocation);
  }

  location() {
    return this.location_;
  }

  async download(entry, callback) {
    if (this.downloading) {
      return;
    }
    try {
      this.downloading = true;

      // Download lyrics
      entry.updateStatus(Status.PreDownload);
      const lyrics = entry.lyrics();
      const lyricsPath = `${this.location_}/${lyrics.id()}.ass`;
      if (!fs.existsSync(lyricsPath)) {
        fs.writeFileSync(lyricsPath, await lyrics.formattedLyrics());
      }

      // Download MV
      entry.updateStatus(Status.Download);
      const mv = entry.mv();
      const mvPath = `${this.location_}/${mv.id()}.mp4`;
      this.ytDlp
        .exec([mv.url(), "-o", mvPath].concat(mv.format()))
        .on("progress", (progress) => {
          entry.updateProgress(progress.percent ?? 0);
        })
        .on("error", (e) => {
          console.error(e);
          // Clean up
          if (fs.existsSync(mvPath)) {
            fs.rmSync(mvPath);
          }

          entry.fail(e.message);
          this.downloading = false;
          callback(false);
        })
        .on("close", () => {
          entry.updateStatus(Status.PlayQueue);
          this.downloading = false;
          callback(true);
        });
    } catch (e) {
      console.error(e);
      entry.fail(e.message);
      this.downloading = false;
      callback(false);
    }
  }
}

export default Downloader;
