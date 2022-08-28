let config = {
  VIDEO_WIDTH: 1920,
  VIDEO_HEIGHT: 1080,
  FONT_SIZE: 100,
  FONT_FAMILY: "Source Han Serif",
  RUBY_FONT_SIZE: 50,
  PRIMARY_COLOR: "#000000FF",
  SECONDARY_COLOR: "#00FFFFFF",
  OUTLINE_COLOR: "#00000000",
  BOLD: false,
  COUNT: 3,
  SYMBOL: "●",
  ADVANCE: 5,
  DELAY: 1,
  // Safe distance of subtitles relative to the edge of the screen
  SCREEN_SAFE_PADDING: 400,
};

export const updateConfig = (newConfig) => {
  config = {
    ...config,
    newConfig,
  };
};

export default config;
