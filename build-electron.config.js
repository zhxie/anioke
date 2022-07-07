module.exports = {
  mainEntry: "electron/main.js",
  preloadEntry: "electron/preload.js",
  outDir: "public",
  externals: {
    "better-sqlite3": "commonjs better-sqlite3",
  },
  mainTarget: "electron18.0-main",
  preloadTarget: "electron18.0-preload",
};
