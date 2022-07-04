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
    return `Dialogue: 0,${Utils.convertTime(
      this.startTime - advance
    )},${Utils.convertTime(this.endTime + delay)},${assStyle},,0,0,0,,${words}`;
  };
}

class Utils {
  static header(title) {
    return `[Script Info]
Title: ${title}
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: K1,Source Han Serif,24,&H000000FF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,4,0,1,60,30,80,1
Style: K2,Source Han Serif,24,&H000000FF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,4,0,3,30,60,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  }

  static compile(style, lines) {
    const ASS_STYLES = ["K1", "K2"];
    const ADVANCE = 5;
    const DELAY = 1;

    let result = [];
    let displays = new Array(ASS_STYLES.length).fill(0);
    for (const line of lines) {
      if (line.isEmpty()) {
        continue;
      }

      // Calculate lyrics show in advance time.
      let newParagraph = false;
      const prevTime = Math.max(...displays);
      if (prevTime < line.startTime) {
        newParagraph = true;
      }

      const lastTime = Math.min(...displays);
      let index = displays.indexOf(lastTime);
      if (newParagraph) {
        index = 0;
      }
      let advance = Math.max(line.startTime - lastTime, 0);
      if (newParagraph) {
        advance = Math.min(advance, ADVANCE);
      }

      const assStyle = ASS_STYLES[index];
      result.push(line.compile(style, assStyle, advance, DELAY));

      if (newParagraph) {
        displays.fill(line.startTime - advance);
      }
      displays[index] = line.endTime + DELAY;
    }
    return result.join("\n");
  }

  static convertTime(time) {
    const hour = parseInt(String(time / 3600));
    const min = parseInt(String((time - 3600 * hour) / 60));
    const sec = parseInt(String(time - 3600 * hour - 60 * min));
    const mil = Math.min(
      Math.round((time - 3600 * hour - 60 * min - sec) * 100),
      99
    );
    return `${hour}:${Utils.padTime(min)}:${Utils.padTime(sec)}.${Utils.padTime(
      mil
    )}`;
  }

  static padTime(timeComponent) {
    return String(timeComponent).padStart(2, "0");
  }
}

export { Style, Word, Line };
export default Utils;
