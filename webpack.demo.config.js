const path = require('path')
const webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/demo/main.js',
  output: {
    path: path.resolve(__dirname, 'demo'),
    filename: 'demo.js',
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
          'postcss-loader', // 必要なら
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
        use: [{
          loader: 'svg-inline-loader',
          options: {}
        }],
      },
    ],
  },
  devtool: 'eval-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'demo'),
    },
    compress: true,
    port: 3000,
    host: '0.0.0.0',
    proxy:
      [
        {
          context: ['/aplayer'],
          target: 'https://cn-east-17-aplayer-35525609.oss.dogecdn.com/',
          secure: false,
          changeOrigin: true,
          headers: {
            host: 'vue-aplayer.js.org',
            Referer: 'https://vue-aplayer.js.org/',
            pathRewrite(path) {
              return path.replace(/^\/aplayer/, '')
            },
          },
        },
      ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      // 'process.env': {
      //   NODE_ENV: `"${process.env.NODE_ENV}"`,
      // },
      VERSION: JSON.stringify(require("./package.json").version),
    }),
  ],
}
