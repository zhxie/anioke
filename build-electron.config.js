module.exports = {
  mainEntry: "electron/main.js",
  preloadEntry: "electron/preload.js",
  outDir: "public",
  externals: {
    "better-sqlite3": "commonjs better-sqlite3",
  },
  mainTarget: "electron19.0-main",
  preloadTarget: "electron19.0-preload",
};
