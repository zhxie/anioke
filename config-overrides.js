const HtmlWebpackPlugin = require("html-webpack-plugin");

const isEnvProduction = process.env.NODE_ENV === "production";

module.exports = function override(config) {
  config.entry = {
    // Using "main" as key instead of "player" is restricted by react-scripts
    main: "./src/player/index.js",
    webUI: "./src/web-ui/index.js",
  };

  if (!isEnvProduction) {
    config.output.filename = "static/js/[name].bundle.js";
  }

  const mainHtmlOptions = config.plugins.find((p) => {
    return p.constructor.name === "HtmlWebpackPlugin";
  }).userOptions;
  mainHtmlOptions.chunks = ["main"];
  const webUIHtmlPlugin = new HtmlWebpackPlugin({
    ...mainHtmlOptions,
    template: "public/web-ui/index.html",
    chunks: ["webUI"],
    filename: "web-ui/index.html",
  });
  config.plugins.push(webUIHtmlPlugin);
  return config;
};
