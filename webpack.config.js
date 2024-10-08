const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: './PWA/login.js',  // Vhodna točka
  output: {
    filename: 'bundle.js',  // Glavni izhodni JavaScript file
    path: path.resolve(__dirname, 'dist'),  // Izhodna mapo
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',  // Transpilacija z Babel
        },
      },
      {
        test: /\.html$/,
        use: ['html-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './PWA/login.html',
      filename: 'login.html',
    }),
  ],
  resolve: {
    extensions: ['.js', '.json', '.css', '.html'],
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 3000,
    open: true,
  },
  mode: 'development',
};