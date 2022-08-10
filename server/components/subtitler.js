import { Style } from "../models/lyrics/common/lyrics";
import { padStart } from "../utils";

const compileWord = (word) => {
  const duration = Math.round((word["endTime"] - word["startTime"]) * 100);
  return `{\\K${duration}}${word["word"]}`;
};

const formatTime = (time) => {
  const hour = parseInt(String(time / 3600));
  const min = parseInt(String((time - 3600 * hour) / 60));
  const sec = parseInt(String(time - 3600 * hour - 60 * min));
  const mil = Math.min(
    Math.round((time - 3600 * hour - 60 * min - sec) * 100),
    99
  );
  return `${hour}:${padStart(min, 2)}:${padStart(sec, 2)}.${padStart(mil, 2)}`;
};

const formatColor = (color) => {
  return color.toUpperCase().replace("#", "&H");
};

class Subtitler {
  ASS_STYLES = ["K1", "K2"];

  style = Style.Karaoke;
  // TODO: These constants should be configurable.
  ADVANCE = 5;
  DELAY = 1;
  FONTSIZE = 24;
  PRIMARY_COLOR = "#000000FF";
  SECONDARY_COLOR = "#00FFFFFF";
  OUTLINE_COLOR = "#00000000";
  BACKGROUND_COLOR = "#00000000";
  BOLD = false;
  OUTLINE = 2;
  SHADOW = 0;

  constructor(style) {
    this.style = style;
  }

  compile = (lines, lyrics) => {
    const style = this.bestStyle(lyrics.style());
    const dialogues = this.dialogues(lines, style);
    const header = this.header(lyrics.title());
    return `${header}\n${dialogues}`;
  };

  header = (title) => {
    // prettier-ignore
    return `[Script Info]
Title: ${title}
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: K1,Source Han Serif,${this.FONTSIZE},${formatColor(this.PRIMARY_COLOR)},${formatColor(this.SECONDARY_COLOR)},${formatColor(this.OUTLINE_COLOR)},${formatColor(this.BACKGROUND_COLOR)},${this.BOLD ? 1 : 0},0,0,0,100,100,0,0,1,${this.OUTLINE},${this.SHADOW},1,60,30,80,1
Style: K2,Source Han Serif,${this.FONTSIZE},${formatColor(this.PRIMARY_COLOR)},${formatColor(this.SECONDARY_COLOR)},${formatColor(this.OUTLINE_COLOR)},${formatColor(this.BACKGROUND_COLOR)},${this.BOLD ? 1 : 0},0,0,0,100,100,0,0,1,${this.OUTLINE},${this.SHADOW},3,30,60,40,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  };

  dialogue = (line, style, assStyle, advance) => {
    let words;
    switch (style) {
      case Style.Traditional:
        words = `{\\K${Math.round(advance * 100)}}{\\K0}`;
        words += line["line"];
        break;
      case Style.Karaoke:
        words = `{\\K${Math.round(advance * 100)}}`;
        words += line["words"].map(compileWord).join("");
        break;
      default:
        throw new Error(`unexpected style "${style}"`);
    }
    return `Dialogue: 0,${formatTime(line["startTime"] - advance)},${formatTime(
      line["endTime"] + this.DELAY
    )},${assStyle},,0,0,0,,${words}`;
  };

  dialogues = (lines, style) => {
    let result = [];
    let displays = new Array(this.ASS_STYLES.length).fill(0);
    for (const line of lines) {
      // Escape empty lines.
      if (!line["line"]) {
        continue;
      }

      // Identify new paragraphs.
      let newParagraph = false;
      const lastEndTime = Math.max(...displays);
      if (lastEndTime < line["startTime"] - this.ADVANCE || lastEndTime === 0) {
        // Assert there is a new paragraph if there are more than `advance`
        // blank.
        newParagraph = true;
      }

      // Calculate lyrics show in advance time.
      const priorEndTime = Math.min(...displays);
      let index = 0;
      if (!newParagraph) {
        index = displays.indexOf(priorEndTime);
      }
      let advance = Math.max(line["startTime"] - priorEndTime, 0);
      if (newParagraph) {
        advance = Math.min(advance, this.ADVANCE);
      }

      const assStyle = this.ASS_STYLES[index];
      result.push(this.dialogue(line, style, assStyle, advance));

      // Clean up.
      if (newParagraph) {
        displays.fill(line["startTime"] - advance);
      }
      displays[index] = line["endTime"] + this.DELAY;
    }
    return result.join("\n");
  };

  bestStyle = (style) => {
    switch (style) {
      case Style.Traditional:
        switch (this.style) {
          case Style.Traditional:
          case Style.Karaoke:
            return Style.Traditional;
          default:
            throw new Error(`unexpected style "${this.style}"`);
        }
      case Style.Karaoke:
        switch (this.style) {
          case Style.Traditional:
            return Style.Traditional;
          case Style.Karaoke:
            return Style.Karaoke;
          default:
            throw new Error(`unexpected style "${this.style}"`);
        }
      default:
        throw new Error(`unexpected style "${style}"`);
    }
  };
}

export default Subtitler;
