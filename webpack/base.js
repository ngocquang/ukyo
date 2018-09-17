const fs = require('fs');
const webpack = require('webpack');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const path = require('path');
const address = require('ip').address;

const { PORT } = require('./const');
const paths = require('./paths');

const pugTemplates = [];
const srcll = fs.readdirSync(paths.dirSrcPug);
srcll.forEach(s => s.endsWith('.pug') && pugTemplates.push(s));

module.exports = (env, argv) => {
  const devMode = argv.mode !== 'production';
  return {
    entry: {
      app: [
        'webpack/hot/only-dev-server',
        path.join(paths.dirSrcJs, 'app'),
      ],
      vendor: [
        'es6-promise',
        'fetch-polyfill',
      ],
    },
    output: {
      path: paths.dirDist,
      publicPath: devMode ? `http://${address()}:${PORT}/` : '/',
      filename: 'js/[name].js',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [
            { loader: "babel-loader" },
          ]
        },
        {
          test: /\.js$/,
          use: ["source-map-loader"],
          enforce: "pre",
        },
        {
          test: /\.pug$/,
          use: [
            { loader: 'raw-loader' },
            {
              loader: "pug-html-loader",
              options: {
                pretty: true,
              }
            },
          ]
        },
        {
          test: /\.css$/,
          use: [
            'css-hot-loader',
            MiniCssExtractPlugin.loader,
            'css-loader',
          ],
        },
        {
          test: /\.scss$/,
          use: [
            { loader: 'css-hot-loader' },
            { loader: devMode ? 'style-loader' : MiniCssExtractPlugin.loader },
            {
              loader: "css-loader",
              options: {
                sourceMap: true,
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
              },
            },
          ]
        }
      ]
    },
    plugins: [
      ...pugTemplates.map(templateName => new HtmlWebPackPlugin({
        inject: true,
        template: `./src/pug/${templateName}`,
        filename: path.join(paths.dirDist, templateName.replace('.pug', '.html')),
        minify: false,
        alwaysWriteToDisk: true,
      })),
      new MiniCssExtractPlugin({
        filename: 'css/app.css',
      }),
      new CopyWebpackPlugin([
        {
          from:'src/assets',
          to:'assets'
        }
      ]),
      new webpack.HotModuleReplacementPlugin(),
    ],
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          cache: true,
          parallel: true,
          sourceMap: true // set to true if you want JS source maps
        }),
        new OptimizeCSSAssetsPlugin({})
      ]
    },
    devServer: {
      // contentBase: 'public',
      hot: true,
      lazy: false,
      host: address(),
      port: PORT,
      clientLogLevel: 'error',
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      stats: {
        colors: true,
        assets: true,
        modules: false,
        excludeAssets: assetName => assetName.includes('hot-update')
      }
    },
    devtool: devMode ? 'eval-source-map' : 'source-map',
  };
};
