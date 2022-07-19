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
  error_ = "";

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

  sequence = () => {
    return this.sequence_;
  };

  status = () => {
    return this.status_;
  };

  error = () => {
    return this.error_;
  };

  mv = () => {
    return this.mv_;
  };

  mvPath = () => {
    return this.mvPath_;
  };

  lyrics = () => {
    return this.lyrics_;
  };

  lyricsPath = () => {
    return this.lyricsPath_;
  };

  format = async () => {
    const lyrics = await this.lyrics_.format(false);
    return {
      sequence: this.sequence_,
      status: this.status_,
      error: this.error_,
      mv: this.mv_.format(lyrics),
      lyrics: lyrics,
    };
  };

  onDownloadQueue = async () => {
    this.status_ = Status.DownloadQueue;
  };

  onDownload = () => {
    this.status_ = Status.Download;
  };

  onEncodeQueue = () => {
    this.status_ = Status.EncodeQueue;
  };

  onEncode = () => {
    this.status_ = Status.Encode;
  };

  onPlayQueue = () => {
    this.status_ = Status.PlayQueue;
  };

  onPlay = () => {
    this.status_ = Status.Play;
  };

  onFail = (e) => {
    this.status_ = Status.Fail;
    this.error_ = e;
  };

  isRemovable = () => {
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
  };

  isDownloadQueued = () => {
    return this.status_ == Status.DownloadQueue;
  };

  isEncodeQueued = () => {
    return this.status_ == Status.EncodeQueue;
  };

  isPlayQueued = () => {
    return this.status_ == Status.PlayQueue;
  };

  isPlaying = () => {
    return this.status_ == Status.Play;
  };
}

export default Entry;
