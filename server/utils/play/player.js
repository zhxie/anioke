import Utils from "../common/utils";

class Player {
  playCallback;
  stopCallback;
  seekCallback;
  switchTrackCallback;

  list_ = [];

  constructor(onPlay, onStop, onSeek, onSwitchTrack) {
    this.playCallback = onPlay;
    this.stopCallback = onStop;
    this.seekCallback = onSeek;
    this.switchTrackCallback = onSwitchTrack;
  }

  list() {
    return this.list_;
  }

  add(entry) {
    entry.onPlayQueue();
    this.list_.push(entry);
    this.play();
  }

  play() {
    const i = this.list_.findIndex((entry) => entry.isPlaying());
    if (i >= 0) {
      return;
    }

    const entry = this.list_.find((entry) => entry.isPlayQueued());
    if (!entry) {
      this.stopCallback();
      return;
    }

    entry.onPlay();
    this.playCallback(entry.sequence(), entry.mvPath(), entry.lyricsPath(), 0);
  }

  next() {
    const entry = this.list_.find((entry) => entry.isPlaying());
    if (entry) {
      this.remove(entry.sequence());
    }

    this.play();
  }

  remove(sequence) {
    const i = this.list_.findIndex((entry) => entry.sequence() == sequence);
    if (this.list_[i].isPlaying()) {
      this.stopCallback();
    }
    if (i >= 0 && this.list_[i].isRemovable()) {
      this.list_.splice(i, 1);
    }

    this.play();
  }

  switchTrack() {
    this.switchTrackCallback();
  }

  shuffle() {
    const i = this.list_.findIndex((entry) => entry.isPlaying());
    let entry = undefined;
    if (i >= 0) {
      entry = this.list_[i];
      this.list_.splice(i, 1);
    }

    Utils.shuffle(this.list_);
    if (entry) {
      this.list_.unshift(entry);
    }
  }

  topmost(sequence) {
    if (this.list_.length < 2) {
      return;
    }

    const i = this.list_.findIndex((entry) => entry.sequence() == sequence);
    if (i < 0) {
      return;
    }

    const entry = this.list_[i];
    this.list_.splice(i, 1);
    this.list_.splice(1, 0, entry);
  }

  replay() {
    this.seekCallback(0);
  }
}

export default Player;
