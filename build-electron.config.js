module.exports = {
  mainEntry: "electron/main.js",
  preloadEntry: "electron/preload.js",
  outDir: "public",
  externals: {
    "@alpacamybags118/yt-dlp-exec": "commonjs @alpacamybags118/yt-dlp-exec",
    "better-sqlite3": "commonjs better-sqlite3",
    "ffmpeg-static": "commonjs ffmpeg-static",
  },
  mainTarget: "electron18.0-main",
  preloadTarget: "electron18.0-preload",
  customMainConfig: {
    module: {
      rules: [
        {
          test: /\.node$/,
          loader: "node-loader",
        },
      ],
    },
  },
};
