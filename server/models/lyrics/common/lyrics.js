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

  compile = () => {
    const duration = Math.round((this.endTime - this.startTime) * 100);
    return `{\\K${duration}}${this.word}`;
  };
}

const padTime = (timeComponent) => {
  return String(timeComponent).padStart(2, "0");
};

const convertTime = (time) => {
  const hour = parseInt(String(time / 3600));
  const min = parseInt(String((time - 3600 * hour) / 60));
  const sec = parseInt(String(time - 3600 * hour - 60 * min));
  const mil = Math.min(
    Math.round((time - 3600 * hour - 60 * min - sec) * 100),
    99
  );
  return `${hour}:${padTime(min)}:${padTime(sec)}.${padTime(mil)}`;
};

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

  isEmpty = () => {
    return this.line.trim().length == 0;
  };

  compile = (style, assStyle, advance, delay) => {
    let words = this.line;
    switch (style) {
      case Style.Traditional:
        break;
      case Style.Karaoke:
        words = `{\\K${Math.round(advance * 100)}}`;
        words += this.words.map((value) => value.compile()).join("");
        break;
      default:
        throw new Error(`unexpected style "${style}"`);
    }
    return `Dialogue: 0,${convertTime(this.startTime - advance)},${convertTime(
      this.endTime + delay
    )},${assStyle},,0,0,0,,${words}`;
  };
}

export { Style, Word, Line };
