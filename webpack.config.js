const path = require("path");

module.exports = [
  {
    mode: "development",
    entry: "./src/index.ts",
    target: "web",
    devtool: "source-map",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "index.js",
      library: "visualizeCarta",
      libraryTarget: "umd",
    },
    resolve: {
      modules: [path.resolve(__dirname, "src"), "node_modules"],
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.[jt]s$/,
          include: /src/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-typescript"],
            },
          },
        },
      ],
    },
  },
];
