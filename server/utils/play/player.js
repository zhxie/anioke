class Player {
  list_ = [];

  list() {
    return this.list_;
  }

  add(entry) {
    this.list_.push(entry);
    this.play();
  }

  play() {
    const i = this.list_.findIndex((entry) => entry.isPlaying());
    if (i >= 0) {
      return;
    }

    const entry = this.list_.find((entry) => entry.isCompleted());
    entry.onPlay();
    this.play_(entry.sequence(), entry.mvPath(), entry.lyricsPath(), 0);
  }

  stop() {
    this.stop_();
  }
}

export default Player;
