import { Utils } from "./utils";

const Status = {
  DownloadQueue: "download_queue",
  PreDownload: "pre_download",
  Download: "download",
  Encode: "encode",
  PlayQueue: "play_queue",
  Play: "play",
  Fail: "fail",
};

class Entry {
  sequence_;
  status_ = Status.DownloadQueue;
  progress_ = 0;
  error_ = 0;

  mv_;
  lyrics_;

  constructor(mv, lyrics) {
    this.sequence_ = Utils.generateSequence();
    this.mv_ = mv;
    this.lyrics_ = lyrics;
  }

  sequence() {
    return this.sequence_;
  }

  status() {
    return this.status_;
  }

  progress() {
    return this.progress_;
  }

  error() {
    return this.error_;
  }

  mv() {
    return this.mv_;
  }

  lyrics() {
    return this.lyrics_;
  }

  updateStatus(status) {
    this.status_ = status;
  }

  updateProgress(progress) {
    this.progress_ = progress;
  }

  fail(error) {
    this.status_ = Status.Fail;
    this.error_ = error;
  }
}

export { Status };
export default Entry;
