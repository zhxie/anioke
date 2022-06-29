import fs from "fs";
import YTDlpWrap from "yt-dlp-wrap";
import Entry from "../common/entry";
import Utils from "../common/utils";

const Encoding = {
  FFmpeg: "ffmpeg",
  SoX: "sox",
};

class Downloader {
  location_;
  ytDlp;
  encoding;
  ffmpegLocation;
  soxLocation;
  completeCallback;

  downloading = false;
  list_ = [];

  constructor(
    location,
    ytDlpLocation,
    encoding,
    ffmpegLocation,
    soxLocation,
    onComplete
  ) {
    this.location_ = location;
    // Creates a directory if it does not exist in advance.
    fs.mkdirSync(location, {
      recursive: true,
    });
    this.ytDlp = new YTDlpWrap(ytDlpLocation);
    this.encoding = encoding;
    this.ffmpegLocation = ffmpegLocation;
    this.soxLocation = soxLocation;
    this.completeCallback = onComplete;
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
    const i = this.list_.findIndex((entry) => entry.sequence() == sequence);
    if (i >= 0 && list[i].isRemovable()) {
      this.list_.splice(i, 1);
    }
  }

  async download() {
    if (this.downloading) {
      return;
    }

    const i = this.list_.findIndex((entry) => entry.isQueued());
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
        console.error(e);
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

    // Download and encode MV
    const mv = entry.mv();
    const mvPath = `${this.location_}/${mv.id()}.mp4`;
    if (!fs.existsSync(mvPath)) {
      try {
        await this.ytDlp.execPromise(
          [mv.url(), "-o", mvPath].concat(mv.format())
        );
      } catch (e) {
        console.error(e);
        // Clean up
        if (fs.existsSync(mvPath)) {
          fs.rmSync(mvPath);
        }

        entry.onFail(e.message);
        this.downloading = false;
        this.download();
        return;
      }

      entry.onEncode();
      switch (this.encoding) {
        case Encoding.FFmpeg:
          {
            const karaokePath = `${this.location_}/${mv.id()}.aac`;
            const genMVPath = `${this.location_}/${mv.id()}.gen.mp4`;
            try {
              await Utils.exec(
                `${this.ffmpegLocation} -i ${mvPath} -vn -af pan="stereo|c0=c0|c1=-1*c1" -ac 1 -y ${karaokePath}`
              );
              await Utils.exec(
                `${this.ffmpegLocation} -i ${mvPath} -i ${karaokePath} -map 0 -map 1:a -y ${genMVPath}`
              );
              fs.rmSync(karaokePath);
              fs.rmSync(mvPath);
              fs.renameSync(genMVPath, mvPath);
            } catch (e) {
              console.error(e);
              // Clean up
              if (fs.existsSync(karaokePath)) {
                fs.rmSync(karaokePath);
              }
              if (fs.existsSync(genMVPath)) {
                fs.rmSync(genMVPath);
              }

              entry.onFail(e.message);
              this.downloading = false;
              this.download();
              return;
            }
          }
          break;
        case Encoding.SoX:
          {
            const musicPath = `${this.location_}/${mv.id()}.mp3`;
            const karaokePath = `${this.location_}/${mv.id()}.k.mp3`;
            const genMVPath = `${this.location_}/${mv.id()}.gen.mp4`;
            try {
              await Utils.exec(
                `${this.ffmpegLocation} -i ${mvPath} -vn -y ${musicPath}`
              );
              await Utils.exec(
                `${this.soxLocation} ${musicPath} ${karaokePath} oops`
              );
              fs.rmSync(musicPath);
              await Utils.exec(
                `${this.ffmpegLocation} -i ${mvPath} -i ${karaokePath} -map 0 -map 1:a -y ${genMVPath}`
              );
              fs.rmSync(karaokePath);
              fs.rmSync(mvPath);
              fs.renameSync(genMVPath, mvPath);
            } catch (e) {
              console.error(e);
              // Clean up
              if (fs.existsSync(musicPath)) {
                fs.rmSync(musicPath);
              }
              if (fs.existsSync(karaokePath)) {
                fs.rmSync(karaokePath);
              }
              if (fs.existsSync(genMVPath)) {
                fs.rmSync(genMVPath);
              }

              entry.onFail(e.message);
              this.downloading = false;
              this.download();
              return;
            }
          }
          break;
        default:
          throw new Error(`unexpected encoding "${this.encoding}"`);
      }
    }

    entry.onComplete();
    this.completeCallback(entry);
    this.list_.splice(i, 1);
    this.downloading = false;
    this.download();
  }
}

export default Downloader;
