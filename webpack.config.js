// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const ESLintPlugin = require('eslint-webpack-plugin');
const webpack = require('webpack');

const isProduction = process.env.NODE_ENV == "production";

const resolve = (relativePath) => path.resolve(__dirname, relativePath);

const config = {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: '[name].js'
  },
  plugins: [
    // Add your plugins here
    // Learn more about plugins from https://webpack.js.org/configuration/plugins/
    new ESLintPlugin(),
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map[query]',
      exclude: ['vendor.js'],
    })
  ],
  target: ["node"],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        use: [
          {
            loader: "babel-loader",
            options: {
              babelrc: false,
              plugins: ["@loadable/babel-plugin"],
            },
          },
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          }
        ],
        include: [resolve("./src")],
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
