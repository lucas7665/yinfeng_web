const { defineConfig } = require('@vue/cli-service')
const DefineOptions = require('unplugin-vue-define-options/webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      DefineOptions()
    ]
  },
  // 根据环境变量决定输出目录和publicPath
  outputDir: process.env.VUE_APP_OUTPUT_DIR || '/Users/mac/dkt_project/yinfeng/src/main/resources/static',
  publicPath: process.env.VUE_APP_PUBLIC_PATH || '/',
  devServer: {
    proxy: {
      '/api': {
        target: 'https://lgj-8082.colorstoneai.com',
        changeOrigin: true,
        ws: false,
        secure: false
      }
    }
  },
  lintOnSave: false  // 暂时关闭保存时的 lint 检查
})
