const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  // entry: "./src/study.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  },
  plugins: [new HtmlWebpackPlugin()],
  devtool: "source-map",
  resolve: {
    extensions: [".ts", ".js"]
  },
  devServer: {
    open: true
    // hot: true
  }
};
