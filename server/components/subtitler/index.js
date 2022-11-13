import { Style } from "../../models/lyrics/common/lyrics";
import config from "./config";
import {
  formatColor,
  formatTime,
  getCountdownTrackPos,
  getLyricTrackPos,
  getRubyTrackPos,
} from "./helpers";

class Subtitler {
  COUNTDOWN_STYLE = "CD";
  LYRIC_STYLE = "Lyric";
  RUBY_STYLE = "Ruby";

  style;
  rubies;
  countdown;

  constructor(style, rubies, countdown) {
    this.style = style;
    this.rubies = rubies;
    this.countdown = countdown;
  }

  compile = (lines, lyrics) => {
    const style = this.bestStyle(lyrics.style());
    const dialogues = this.dialogues(this.formatLines(lines), style);
    const header = this.header(lyrics.title());
    return `${header}\n${dialogues}`;
  };

  header = (title) => {
    // prettier-ignore
    return `[Script Info]
Title: ${title}
ScriptType: v4.00+
PlayResX: ${config.VIDEO_WIDTH}
PlayResY: ${config.VIDEO_HEIGHT}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ${this.COUNTDOWN_STYLE},${config.FONT_FAMILY},${config.FONT_SIZE},${formatColor(config.PRIMARY_COLOR)},${formatColor(config.SECONDARY_COLOR)},${formatColor(config.OUTLINE_COLOR)},#00000000,${config.BOLD ? 1 : 0},0,0,0,100,100,0,0,1,3,0,1,0,0,0,1
Style: ${this.LYRIC_STYLE},${config.FONT_FAMILY},${config.FONT_SIZE},${formatColor(config.PRIMARY_COLOR)},${formatColor(config.SECONDARY_COLOR)},${formatColor(config.OUTLINE_COLOR)},#00000000,${config.BOLD ? 1 : 0},0,0,0,100,100,0,0,1,4,0,1,0,0,0,1
Style: ${this.RUBY_STYLE},${config.FONT_FAMILY},${config.RUBY_FONT_SIZE},${formatColor(config.PRIMARY_COLOR)},${formatColor(config.SECONDARY_COLOR)},${formatColor(config.OUTLINE_COLOR)},#00000000,${config.BOLD ? 1 : 0},0,0,0,100,100,0,0,1,4,0,2,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  };

  word = (word) => {
    const duration = Math.round((word["endTime"] - word["startTime"]) * 100);
    const spaceMatches = word.word.match(/^(\s*)(\S+|\S+\s*\S+)*(\s*)$/);
    if (word.word.trim().length === 0 || !spaceMatches) {
      return `{\\K${duration}}${word["word"]}`;
    }
    const prefixSpaces = spaceMatches[1];
    const suffixSpaces = spaceMatches[3];
    const line = word.word.trim();
    // Each space is converted to k1, and the duration of words should minus spaces.
    const lineDuration = duration - prefixSpaces.length - suffixSpaces.length;
    return [
      ...Array(prefixSpaces.length).fill(`{\\K1} `),
      `{\\K${lineDuration}}${line}`,
      ...Array(suffixSpaces.length).fill(`{\\K1} `),
    ].join("");
  };

  dialogue = (options) => {
    const { line, style, assStyle, advance, pos } = options;
    let words;
    switch (style) {
      case Style.Traditional:
        words = `{\\K${Math.round(advance * 100)}}{\\K0}`;
        words += line["line"];
        break;
      case Style.Karaoke:
        words = `{\\K${Math.round(advance * 100)}}`;
        words += line["words"].map(this.word).join("");
        break;
      default:
        throw new Error(`unexpected style "${style}"`);
    }
    return `Dialogue: 0,${formatTime(line["startTime"] - advance)},${formatTime(
      line["endTime"] + config.DELAY
    )},${assStyle},,0,0,0,,{\\pos(${pos.x},${pos.y})}${words}`;
  };

  rubyDialogues = (options) => {
    const { line, advance, trackIndex, style } = options;
    const result = [];
    const fullWords = line.words.map((word) => word.word).join("");
    let cachedWords = "";
    // Handle rubies.
    line.words.forEach((word) => {
      cachedWords += word.word;
      if (!word.rubies || !word.rubies.length) {
        return;
      }
      const waitedTime = Math.round(
        (word.startTime - line.startTime + advance) * 100
      );
      const startTime = formatTime(line.startTime - advance);
      const endTime = formatTime(line.endTime + config.DELAY);
      const rubyStartPoint = getRubyTrackPos({
        trackIndex,
        targetWord: word.word.trim(),
        wordsToTarget: cachedWords.trimEnd(),
        fullWords,
      });
      const words =
        style === Style.Karaoke
          ? word.rubies.map(this.word).join("")
          : word.rubies.map((i) => i.word).join("");
      result.push(
        `Dialogue: 1,${startTime},${endTime},${this.RUBY_STYLE},,0,0,0,,{\\pos(${rubyStartPoint.x}, ${rubyStartPoint.y})}{\\K${waitedTime}}${words}`
      );
    });
    return result;
  };

  dialogues = (lines, style) => {
    let result = [];
    // There are 2 tracks for lyrics.
    let tracks = new Array(2).fill(0);
    for (const line of lines) {
      // Escape empty lines.
      if (!line["line"]) {
        continue;
      }

      // Identify new paragraphs.
      let newParagraph = false;
      const lastEndTime = Math.max(...tracks);
      if (
        lastEndTime < line["startTime"] - config.ADVANCE ||
        lastEndTime === 0
      ) {
        // Assert there is a new paragraph if there are more than `advance`
        // blank.
        newParagraph = true;
      }

      // Calculate lyrics show in advance time.
      const priorEndTime = Math.min(...tracks);
      let trackIndex = 0;
      if (!newParagraph) {
        trackIndex = tracks.indexOf(priorEndTime);
      }
      let advance = Math.max(line["startTime"] - priorEndTime, 0);
      if (newParagraph) {
        advance = Math.min(advance, config.ADVANCE);
      }

      // Countdown.
      if (this.countdown && newParagraph) {
        if (advance >= config.COUNT) {
          result.push(
            this.dialogue({
              line: this.withCountdown(line["startTime"]),
              style: Style.Karaoke,
              assStyle: this.COUNTDOWN_STYLE,
              advance: advance - config.COUNT,
              pos: getCountdownTrackPos(),
            })
          );
        }
      }

      result.push(
        this.dialogue({
          line,
          style,
          assStyle: this.LYRIC_STYLE,
          advance,
          pos: getLyricTrackPos(
            line.words.map((w) => w.word).join(""),
            trackIndex
          ),
        })
      );

      if (this.rubies) {
        result = result.concat(
          this.rubyDialogues({
            line,
            advance,
            trackIndex,
            style,
          })
        );
      }

      // Clean up.
      if (newParagraph) {
        tracks.fill(line["startTime"] - advance);
      }
      tracks[trackIndex] = line["endTime"] + config.DELAY;
    }
    return result.join("\n");
  };

  withCountdown = (startTime) => {
    const symbol = `${config.SYMBOL} `;
    const s = startTime - config.COUNT;
    return {
      line: symbol.repeat(config.COUNT),
      startTime: s,
      endTime: startTime - config.DELAY,
      words: Array(config.COUNT)
        .fill()
        .map((_value, i) => {
          return {
            word: symbol,
            startTime: s + i,
            endTime: s + 1 + i,
          };
        }),
    };
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

  formatLines = (lines) => {
    return lines.map((line) => ({
      ...line,
      // The first word and the last word in line should be trimmed. Libass will ignore whitespace at the beginning and end of line while rendering subtitle.
      words: line.words.map((word, index) => {
        const res = {
          ...word,
        };
        // If is the first sentence.
        if (index === 0) {
          res.word = res.word.trimStart();
        }
        // If is the last sentence.
        if (index === line.words.length - 1) {
          res.word = res.word.trimEnd();
        }
        return res;
      }),
    }));
  };
}

export default Subtitler;
