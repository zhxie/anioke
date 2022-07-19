import fs from "fs";
import Utils from "./utils";

const Encoding = {
  FFmpeg: "ffmpeg",
  Custom: "custom",
};

class Encoder {
  method;
  ffmpegLocation;
  custom;
  completeCallback;

  encoding = false;
  list_ = [];

  constructor(method, ffmpegLocation, custom, onComplete) {
    this.method = method;
    this.ffmpegLocation = ffmpegLocation;
    this.custom = custom;
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
      await Utils.exec(`"${this.ffmpegLocation}" -i "${mvPath}"`);
    } catch (e) {
      tracks = e.stderr
        .split(/[\r\n]+/)
        .filter((value) => value.match(/Stream #.*Audio/)).length;
    }

    if (tracks < 2) {
      entry.onEncode();
      const audioPath = `${mvPath}.wav`;
      const karaokePath = `${mvPath}.k.wav`;
      const genMVPath = `${mvPath}.gen.mp4`;
      try {
        // Extract audio to WAV.
        await Utils.exec(
          `"${this.ffmpegLocation}" -i "${mvPath}" -map 0:a:0 -y "${audioPath}"`
        );
        // Make karaoke.
        switch (this.method) {
          case Encoding.FFmpeg:
            await Utils.exec(
              `"${this.ffmpegLocation}" -i "${audioPath}" -af pan="stereo|c0=c0|c1=-1*c1" -ac 1 -y "${karaokePath}"`
            );
            break;
          case Encoding.Custom:
            await Utils.exec(
              this.custom
                .replaceAll("${input}", audioPath)
                .replaceAll("${output}", karaokePath)
            );
            break;
          default:
            throw new Error(`unexpected encoding "${this.method}"`);
        }
        if (fs.existsSync(audioPath)) {
          fs.rmSync(audioPath);
        }
        // Encode to MV.
        await Utils.exec(
          `"${this.ffmpegLocation}" -i "${mvPath}" -i "${karaokePath}" -map 0:v -map 0:a:0 -map 1 -y "${genMVPath}"`
        );
        if (fs.existsSync(karaokePath)) {
          fs.rmSync(karaokePath);
        }
        // Replace MV.
        fs.rmSync(mvPath);
        fs.renameSync(genMVPath, mvPath);
      } catch (e) {
        console.error(e);
        // Clean up.
        if (fs.existsSync(audioPath)) {
          fs.rmSync(audioPath);
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

    this.completeCallback(entry);
    this.list_.splice(i, 1);
    this.encoding = false;
    this.encode();
  };
}

export default Encoder;
