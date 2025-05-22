const path = require('path')
const webpack = require('webpack')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const VueLoaderPlugin = require("vue-loader/lib/plugin");

module.exports = {
  entry: './src/vue-aplayer.vue',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'vue-aplayer.min.js',
    library: 'VueAPlayer',
    libraryTarget: 'umd',
    libraryExport: 'default',
    umdNamedDefine: true
  },

  externals: {
    'hls.js': {
      amd: 'hls.js',
      commonjs: 'hls.js',
      commonjs2: 'hls.js',
      root: 'Hls'
    },
    'vue':  {
      amd: 'vue',
      commonjs: 'vue',
      commonjs2: 'vue',
      root: 'Vue'
    },
  },

  optimization: {
    minimize: true,
    minimizer: [
      `...`, // デフォルトの TerserPlugin を維持
      new CssMinimizerPlugin(),
    ],
  },

  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        use: [{
          loader: 'eslint-loader',
          options: {
            formatter: require('eslint-friendly-formatter'),
            emitWarning: true,
          }
        }],
        enforce: 'pre',
        include: [path.resolve(__dirname, 'src')],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            scss: [
              'vue-style-loader',
              'css-loader',
              'postcss-loader', // 必要なら
              'sass-loader'
            ],
            sass: [
              'vue-style-loader',
              'css-loader',
              'postcss-loader', // 必要なら
              {
                loader: 'sass-loader',
                options: {
                  sassOptions: {
                    indentedSyntax: true
                  }
                }
              }
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'postcss-loader', // 必要なら
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'postcss-loader', // 必要な場合
          'sass-loader'
        ]
      },
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader'
        }],
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg)$/,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 40000
          }
        }],
      },
      {
        test: /\.svg$/,
        resourceQuery: /raw/, // 例: import icon from './logo.svg?raw'
        use: [{
          loader: 'raw-loader',
          options: {}
        }],
      },
    ]
  },
  devtool: 'source-map',
  plugins: [
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: `"${process.env.NODE_ENV}"`
      },
      VERSION: JSON.stringify(require('./package.json').version)
    }),
  ],
}
