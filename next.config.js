const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = {
  // outputがないとstandaloneファイルが見つからずにdockerエラーが発生する
  output: 'standalone',
  // server.jsがnot foundになるのでexperimental.outputFileTracingRootが必要になるという課題を見つけた
  // https://github.com/vercel/turbo/issues/5549
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
}