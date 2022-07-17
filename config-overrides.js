const HtmlWebpackPlugin = require("html-webpack-plugin");

const isEnvProduction = process.env.NODE_ENV === "production";

module.exports = function override(config, env) {
  config.entry = {
    // Using "main" as key instead of "player" is restricted by react-scripts
    main: "./src/player/index.js",
    webui: "./src/webui/index.js",
  };

  if (!isEnvProduction) {
    config.output.filename = "static/js/[name].bundle.js";
  }

  const mainHtmlOptions = config.plugins.find((p) => {
    return p.constructor.name === "HtmlWebpackPlugin";
  }).userOptions;
  mainHtmlOptions.chunks = ["main"];
  const webuiHtmlPlugin = new HtmlWebpackPlugin({
    ...mainHtmlOptions,
    template: "public/webui.html",
    chunks: ["webui"],
    filename: "webui.html",
  });
  config.plugins.push(webuiHtmlPlugin);
  return config;
};
