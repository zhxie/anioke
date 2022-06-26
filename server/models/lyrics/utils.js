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

  compile() {
    const duration = Math.round((this.endTime - this.startTime) * 100);
    return `{\\K${duration}}${this.word}`;
  }
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

  isEmpty() {
    return this.line.trim().length == 0;
  }

  compile(style, assStyle, advance) {
    let words = this.line;
    switch (style) {
      case LyricsStyle.Traditional:
        break;
      case LyricsStyle.Karaoke:
        words = `{\\K${Math.round(advance * 100)}}`;
        words += this.words.map((value) => value.compile()).join("");
        break;
      default:
        throw new Error(`unexpected lyrics style "${style}"`);
    }
    return `Dialogue: 0,${LyricsUtils.convertTime(
      this.startTime - advance
    )},${LyricsUtils.convertTime(this.endTime)},${assStyle},,0,0,0,,${words}`;
  }
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

    let result = [];
    let displays = new Array(ASS_STYLES.length).fill(0);
    let empty = true;
    for (const line of lines) {
      // Calculate lyrics show in advance time.
      let lastTime = Math.min(...displays);
      let index = displays.indexOf(lastTime);
      if (empty) {
        index = 0;
        lastTime = displays[0];
      }
      let a = Math.max(line.startTime - lastTime, 0);
      if (empty) {
        a = Math.min(a, ADVANCE);
      }

      const assStyle = ASS_STYLES[index];
      result.push(line.compile(style, assStyle, a));

      if (empty) {
        displays.fill(line.startTime - a);
      }
      displays[index] = line.endTime;
      empty = line.isEmpty();
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
    return `${hour}:${this.padTime(min)}:${this.padTime(sec)}.${this.padTime(
      mil
    )}`;
  }

  static padTime(timeComponent) {
    return String(timeComponent).padStart(2, "0");
  }
}

export { Style, Word, Line, Utils };
