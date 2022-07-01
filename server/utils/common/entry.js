import Utils from "./utils";

const Status = {
  DownloadQueue: "download_queue",
  Download: "download",
  EncodeQueue: "encode_queue",
  Encode: "encode",
  PlayQueue: "play_queue",
  Play: "play",
  Fail: "fail",
};

class Entry {
  sequence_;
  status_ = Status.DownloadQueue;
  error_ = 0;

  mv_;
  mvPath_;
  lyrics_;
  lyricsPath_;

  constructor(mv, mvPath, lyrics, lyricsPath) {
    this.sequence_ = Utils.generateSequence();
    this.mv_ = mv;
    this.lyrics_ = lyrics;
    this.mvPath_ = mvPath;
    this.lyricsPath_ = lyricsPath;
  }

  sequence() {
    return this.sequence_;
  }

  status() {
    return this.status_;
  }

  error() {
    return this.error_;
  }

  mv() {
    return this.mv_;
  }

  mvPath() {
    return this.mvPath_;
  }

  lyrics() {
    return this.lyrics_;
  }

  lyricsPath() {
    return this.lyricsPath_;
  }

  async format() {
    return {
      sequence: this.sequence_,
      status: this.status_,
      error: this.error_,
      mv: this.mv_.format(this.lyrics_.id()),
      lyrics: await this.lyrics_.format(false),
    };
  }

  onDownloadQueue() {
    this.status_ = Status.DownloadQueue;
  }

  onDownload() {
    this.status_ = Status.Download;
  }

  onEncodeQueue() {
    this.status_ = Status.EncodeQueue;
  }

  onEncode() {
    this.status_ = Status.Encode;
  }

  onPlayQueue() {
    this.status_ = Status.PlayQueue;
  }

  onPlay() {
    this.status_ = Status.Play;
  }

  onFail() {
    this.status_ = Status.onFail;
  }

  isRemovable() {
    switch (this.status_) {
      case Status.DownloadQueue:
      case Status.EncodeQueue:
      case Status.PlayQueue:
      case Status.Play:
      case Status.Fail:
        return true;
      case Status.Download:
      case Status.Encode:
        return false;
      default:
        throw new Error(`unexpected status "${this.status_}"`);
    }
  }

  isDownloadQueued() {
    return this.status_ == Status.DownloadQueue;
  }

  isEncodeQueued() {
    return this.status_ == Status.EncodeQueue;
  }

  isPlayQueued() {
    return this.status_ == Status.PlayQueue;
  }

  isPlaying() {
    return this.status_ == Status.Play;
  }
}

export default Entry;
