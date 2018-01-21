/* eslint-env node */
const webpack = require('webpack');
const _ = require('lodash');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const NameAllModulesPlugin = require('name-all-modules-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const rules = require('./rules');
const plugins = require('./plugins');
const getAppName = require('./getAppName');

const PORT = process.env.PORT || 3023;
const ENV = process.env.NODE_ENV || 'development';
const IS_PROD = ENV === 'production';
const NO_MAPS = !!process.env.NO_MAPS;
const appName = getAppName();
const DIST_PATH = path.join(process.cwd(), `/dist`);

module.exports = function getConfig() {
  return {
    entry: {
      app: _.compact([
        IS_PROD && require.resolve('babel-polyfill'),
        !IS_PROD && 'react-hot-loader/patch',
        './src/index',
        !IS_PROD && `${require.resolve(`webpack-hot-middleware/client`)}?path=http://localhost:${PORT}/__webpack_hmr`,
      ]),
      'vendor-static': ['react', 'lodash', 'styled-components', 'rebass'],
    },
    output: {
      path: DIST_PATH,
      // NOTE: chunkhash is used for better caching. More info on https://medium.com/webpack/predictable-long-term-caching-with-webpack-d3eee1d3fa31
      // and https://webpack.js.org/guides/caching/
      filename: `[name].${IS_PROD ? '[chunkhash]' : 'chunkhash-will-be-here'}.js`,
      // chunkFilename: 'app/name/[name].bundle-[chunkhash].js',
      publicPath: `http://localhost:${PORT}/`,
    },
    devtool: NO_MAPS ? false : 'source-map',
    // devtool: NO_MAPS ? false : 'cheap-module-source-map',
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    target: 'web',
    module: {
      rules: _.compact([
        {
          test: /\.(js|jsx)$/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                cacheDirectory: true,
              },
            },
          ],
          exclude: [/node_modules\/(?!zen-js)/],
        },
        rules.getTypescriptRule(!IS_PROD),
        {
          test: /\.(png|jpg|gif)$/,
          use: [
            {
              loader: 'url-loader',
              options: { prefix: '/assets/', limit: 1000 },
            },
          ],
        },
        rules.getFontsRule(),
        rules.getCssRule(),
        {
          test: /\.(graphql|gql)$/,
          exclude: /node_modules/,
          loader: 'graphql-tag/loader',
        },
      ]),
    },
    plugins: _.compact([
      !IS_PROD && new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      new HtmlWebpackPlugin({
        template: path.join(__dirname, '../index.html'),
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor-static',
        // NOTE: we avoid to accidentally share common chunks
        minChunks: Infinity,
        // minChunks(module) {
        //   return (
        //     module.context &&
        //     (module.context.indexOf('node_modules') !== -1 || module.context.indexOf('bower_components') !== -1)
        //   );
        // },
      }),
      // NOTE: we need the manifest chunk to avoid invalidating vendor by not including
      // the webpack manifest info there that includes dep information related to app bundles
      new webpack.optimize.CommonsChunkPlugin({
        // NOTE: 'manifest' isn't present in entries, so this is a catch-all (things that aren't common and not explicitly specified)
        name: 'manifest',
      }),

      // new webpack.HashedModuleIdsPlugin(), // NOTE: let's not use it since NamedModulesPlugin results in better paths and friendlier gzipped than this
      new webpack.NamedModulesPlugin(),
      new webpack.NamedChunksPlugin(chunk => {
        if (chunk.name) {
          return chunk.name;
        }
        // Needed for async modules
        return chunk.modules.map(m => path.relative(m.context, m.request)).join('_');
      }),
      new NameAllModulesPlugin(),

      plugins.createDefinePlugin(),

      // TODO: should we consider leaving fingerprinted assets?
      IS_PROD && new CleanWebpackPlugin([DIST_PATH], { allowExternal: true }),

      IS_PROD &&
        new webpack.LoaderOptionsPlugin({
          minimize: true,
          debug: false,
        }),

      IS_PROD &&
        new UglifyJSPlugin({
          sourceMap: true,
        }),
    ]),
  };
};
