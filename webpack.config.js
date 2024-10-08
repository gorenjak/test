const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
  return {
    entry: './PWA/login.js',  // Vhodna točka
    output: {
      filename: 'bundle.js',  // Glavni izhodni JavaScript file
      path: path.resolve(__dirname, 'dist'),  // Izhodna mapa
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader',  // Transpilacija z Babel
        },
        {
          test: /\.html$/,
          use: 'html-loader',
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
        template: './PWA/login.html',  // Preveri pot do tvoje HTML datoteke
        filename: 'login.html',  // Generira 'login.html' v dist
      }),
    ],
    resolve: {
      extensions: ['.js', '.json', '.css', '.html'],
    },
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      port: process.env.PORT || 3000,  // Avtomatsko nastavi port, kadar je to mogoče
      open: true,
    },
    mode: argv.mode || 'development',  // Izberi način (razvoj ali produkcija)
  };
};