const HtmlWebpackPlugin = require("html-webpack-plugin");

const isEnvProduction = process.env.NODE_ENV === "production";

module.exports = function override(config, env) {
  config.entry = {
    // Using "main" as key instead of "player" is restricted by react-scripts
    main: "./src/player/index.js",
    order: "./src/order/index.js",
  };

  if (!isEnvProduction) {
    config.output.filename = "static/js/[name].bundle.js";
  }

  const mainHtmlOptions = config.plugins.find((p) => {
    return p.constructor.name === "HtmlWebpackPlugin";
  }).userOptions;
  mainHtmlOptions.chunks = ["main"];
  const orderHtmlPlugin = new HtmlWebpackPlugin({
    ...mainHtmlOptions,
    template: "public/order.html",
    chunks: ["order"],
    filename: "order.html",
  });
  config.plugins.push(orderHtmlPlugin);
  return config;
};
