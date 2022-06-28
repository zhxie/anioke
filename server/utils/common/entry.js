import { Utils } from "./utils";

const Status = {
  Queue: "queue",
  Download: "download",
  Complete: "complete",
  Play: "play",
  Fail: "fail",
};

class Entry {
  sequence_;
  status_ = Status.Queue;
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

  onDownload() {
    this.status_ = Status.Download;
  }

  onComplete() {
    this.status_ = Status.Complete;
  }

  onPlay() {
    this.status_ = Status.Play;
  }

  onFail() {
    this.status_ = Status.onFail;
  }

  isRemovable() {
    switch (this.status) {
      case Status.Queue:
      case Status.Complete:
      case Status.Play:
      case Status.Fail:
        return true;
      case Status.Download:
        return false;
      default:
        throw new Error(`unexpected status "${this.status_}"`);
    }
  }

  isQueued() {
    return this.status_ == Status.Queue;
  }

  isCompleted() {
    return this.status_ == Status.Complete;
  }

  isPlaying() {
    return this.status_ == Status.Play;
  }
}

export default Entry;
