import { padStart } from "../../utils";
import { createCanvas } from "@napi-rs/canvas";
import config from "./config";

const canvas = createCanvas(1920, 1080);
const ctx = canvas.getContext("2d");

export const measureText = (text = "") => {
  ctx.font = `${config.FONT_SIZE}px "${config.FONT_FAMILY}"`;
  const res = ctx.measureText(text);
  console.log(res);
  const resWidth = res.width;
  const resHeight = res.fontBoundingBoxAscent + res.fontBoundingBoxDescent;
  // refer to Aegisub src/auto4_base.cpp line:159
  const scale = config.FONT_SIZE / resHeight;
  return {
    boxWidth: resWidth * scale,
    boxHeight: resHeight * scale,
  };
};

export const formatTime = (time) => {
  const hour = parseInt(String(time / 3600));
  const min = parseInt(String((time - 3600 * hour) / 60));
  const sec = parseInt(String(time - 3600 * hour - 60 * min));
  const mil = Math.min(
    Math.round((time - 3600 * hour - 60 * min - sec) * 100),
    99
  );
  return `${hour}:${padStart(min, 2)}:${padStart(sec, 2)}.${padStart(mil, 2)}`;
};

export const formatColor = (color) => {
  return color.toUpperCase().replace("#", "&H");
};

// Track height is a constant, which contains heights of lyrics and rubies
const getTrackHeight = () => {
  return config.RUBY_FONT_SIZE + config.FONT_SIZE;
};

export const getLyricTrackPos = (text, trackIndex) => {
  return trackIndex === 0 ? getHighTrackPos(text) : getLowTrackPos(text);
};

// Track for lyrics line 2 (lower one)
const getLowTrackPos = (text) => {
  const lineMeasure = measureText(text);
  return {
    x: config.VIDEO_WIDTH - config.SCREEN_SAFE_PADDING - lineMeasure.boxWidth,
    y: config.VIDEO_HEIGHT - getTrackHeight(),
  };
};

// Track for lyrics line 1 (higher one)
const getHighTrackPos = (text) => {
  return {
    x: config.SCREEN_SAFE_PADDING,
    y: getLowTrackPos().y - getTrackHeight(),
  };
};

// Track for countdown line
export const getCountdownTrackPos = () => {
  return {
    x: config.SCREEN_SAFE_PADDING,
    y: getHighTrackPos().y - getTrackHeight(),
  };
};

// Track for ruby
export const getRubyTrackPos = (options) => {
  const { trackIndex, targetWord, wordsToTarget, fullWords } = options;
  const trackPos = getLyricTrackPos(fullWords, trackIndex);
  return {
    x:
      trackPos.x +
      measureText(wordsToTarget).boxWidth -
      measureText(targetWord).boxWidth / 2,
    y: trackPos.y - (config.FONT_SIZE * 9) / 10,
  };
};
