import { shuffle } from "../utils";

class Player {
  onPlay;
  onStop;
  onSeek;
  onSwitchTrack;
  onOffset;

  list_ = [];

  constructor(onPlay, onStop, onSeek, onSwitchTrack, onOffset) {
    this.onPlay = onPlay;
    this.onStop = onStop;
    this.onSeek = onSeek;
    this.onSwitchTrack = onSwitchTrack;
    this.onOffset = onOffset;
  }

  list = () => {
    return this.list_;
  };

  currentPlay = () => {
    return this.list_.find((entry) => entry.isPlaying());
  };

  currentPlayIndex = () => {
    return this.list_.findIndex((entry) => entry.isPlaying());
  };

  add = (entry) => {
    entry.onPlayQueue();
    this.list_.push(entry);
    this.play();
  };

  play = () => {
    const i = this.currentPlayIndex();
    if (i >= 0) {
      return;
    }

    const entry = this.list_.find((entry) => entry.isPlayQueued());
    if (!entry) {
      this.onStop();
      return;
    }

    entry.onPlay();
    this.onPlay(entry);
  };

  next = () => {
    const entry = this.currentPlay();
    if (entry) {
      this.remove(entry.sequence());
    }

    this.play();
  };

  remove = (sequence) => {
    const i = this.list_.findIndex((entry) => entry.sequence() == sequence);
    const entry = this.list_[i];
    if (i >= 0 && entry.isRemovable()) {
      if (entry.isPlaying()) {
        this.onStop();
      }
      this.list_.splice(i, 1);
    }

    this.play();
  };

  skip = () => {
    const entry = this.currentPlay();
    if (!entry) {
      return;
    }

    this.remove(entry.sequence());
  };

  replay = () => {
    if (!this.currentPlay()) {
      return;
    }

    this.onSeek(0);
  };

  switchTrack = () => {
    const entry = this.currentPlay();
    if (!entry) {
      return;
    }

    this.onSwitchTrack();
  };

  offset = (offset) => {
    const entry = this.currentPlay();
    if (!entry) {
      return;
    }

    this.onOffset(entry.mv().id(), offset);
  };

  shuffle = () => {
    const i = this.currentPlayIndex();
    let entry = undefined;
    if (i >= 0) {
      entry = this.list_[i];
      this.list_.splice(i, 1);
    }

    shuffle(this.list_);
    if (entry) {
      this.list_.unshift(entry);
    }
  };

  topmost = (sequence) => {
    if (this.list_.length < 2) {
      return;
    }

    const i = this.list_.findIndex((entry) => entry.sequence() == sequence);
    if (i < 0) {
      return;
    }

    const entry = this.list_[i];
    if (entry.isPlaying()) {
      return;
    }

    this.list_.splice(i, 1);
    this.list_.splice(1, 0, entry);
  };
}

export default Player;
