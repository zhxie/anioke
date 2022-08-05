const Style = {
  Traditional: "traditional",
  Karaoke: "karaoke",
};

class Word {
  word;
  startTime;
  endTime;

  constructor(word, startTime, endTime) {
    this.word = word;
    this.startTime = startTime;
    this.endTime = endTime;
  }

  format = () => {
    return {
      word: this.word,
      startTime: this.startTime,
      endTime: this.endTime,
    };
  };
}

class Line {
  line;
  startTime;
  endTime;
  words = [];

  constructor(line, startTime, endTime) {
    this.line = line;
    this.startTime = startTime;
    this.endTime = endTime;
  }

  format = () => {
    return {
      line: this.line,
      startTime: this.startTime,
      endTime: this.endTime,
      words: this.words.map((value) => value.format()),
    };
  };
}

export { Style, Word, Line };
