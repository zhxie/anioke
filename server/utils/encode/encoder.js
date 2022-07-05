import fs from "fs";
import Utils from "../common/utils";

const Encoding = {
  FFmpeg: "ffmpeg",
  SoX: "sox",
};

class Encoder {
  method;
  ffmpegLocation;
  soxLocation;
  completeCallback;

  encoding = false;
  list_ = [];

  constructor(method, ffmpegLocation, soxLocation, onComplete) {
    this.method = method;
    this.ffmpegLocation = ffmpegLocation;
    this.soxLocation = soxLocation;
    this.completeCallback = onComplete;
  }

  list = () => {
    return this.list_;
  };

  add = (entry) => {
    entry.onEncodeQueue();
    this.list_.push(entry);
    this.encode();
  };

  remove = (sequence) => {
    const i = this.list_.findIndex((entry) => entry.sequence() == sequence);
    if (i >= 0 && this.list_[i].isRemovable()) {
      this.list_.splice(i, 1);
    }

    this.encode();
  };

  encode = async () => {
    if (this.encoding) {
      return;
    }

    const i = this.list_.findIndex((entry) => entry.isEncodeQueued());
    if (i < 0) {
      return;
    }
    let entry = this.list_[i];

    // Encode.
    this.encoding = true;
    const mvPath = entry.mvPath();

    // Check count of audio tracks in advance.
    let tracks = 2;
    try {
      await Utils.exec(`${this.ffmpegLocation} -i ${mvPath}`);
    } catch (e) {
      tracks = e.stderr
        .split(/[\r\n]+/)
        .filter((value) => value.match(/Stream #.*Audio/)).length;
    }

    if (tracks < 2) {
      entry.onEncode();
      switch (this.method) {
        case Encoding.FFmpeg:
          {
            const karaokePath = `${mvPath}.aac`;
            const genMVPath = `${mvPath}.gen.mp4`;
            try {
              await Utils.exec(
                `${this.ffmpegLocation} -i ${mvPath} -map 0:a:0 -af pan="stereo|c0=c0|c1=-1*c1" -ac 1 -y ${karaokePath}`
              );
              await Utils.exec(
                `${this.ffmpegLocation} -i ${mvPath} -i ${karaokePath} -map 0:v -map 0:a:0 -map 1 -y ${genMVPath}`
              );
              fs.rmSync(karaokePath);
              fs.rmSync(mvPath);
              fs.renameSync(genMVPath, mvPath);
            } catch (e) {
              console.error(e);
              // Clean up.
              if (fs.existsSync(karaokePath)) {
                fs.rmSync(karaokePath);
              }
              if (fs.existsSync(genMVPath)) {
                fs.rmSync(genMVPath);
              }

              entry.onFail(e.message);
              this.encoding = false;
              this.encode();
              return;
            }
          }
          break;
        case Encoding.SoX:
          {
            const musicPath = `${mvPath}.mp3`;
            const karaokePath = `${mvPath}.k.mp3`;
            const genMVPath = `${mvPath}.gen.mp4`;
            try {
              await Utils.exec(
                `${this.ffmpegLocation} -i ${mvPath} -map 0:a:0 -y ${musicPath}`
              );
              await Utils.exec(
                `${this.soxLocation} ${musicPath} ${karaokePath} oops`
              );
              fs.rmSync(musicPath);
              await Utils.exec(
                `${this.ffmpegLocation} -i ${mvPath} -i ${karaokePath} -map 0:v -map 0:a:0 -map 1 -y ${genMVPath}`
              );
              fs.rmSync(karaokePath);
              fs.rmSync(mvPath);
              fs.renameSync(genMVPath, mvPath);
            } catch (e) {
              console.error(e);
              // Clean up.
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
              this.encoding = false;
              this.encode();
              return;
            }
          }
          break;
        default:
          throw new Error(`unexpected encoding "${this.method}"`);
      }
    }

    this.completeCallback(entry);
    this.list_.splice(i, 1);
    this.encoding = false;
    this.encode();
  };
}

export default Encoder;
