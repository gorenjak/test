const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/pwa/login.js',  // Spremeni vhodno točko na login.js
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.html$/,
        use: 'html-loader',
      }
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 8080,
    open: true,  // Avtomatsko odpre brskalnik ob zagonu
    historyApiFallback: {
      index: 'login.html'  // Poskrbi, da se pri uporabi brskalnika vedno odpira login.html
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/pwa/login.html',  // Nastavi kot predlogo login.html
      filename: 'index.html'  // Ustvari index.html kot izhodno datoteko
    }),
  ],
};