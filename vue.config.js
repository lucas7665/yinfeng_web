const { defineConfig } = require('@vue/cli-service')
const DefineOptions = require('unplugin-vue-define-options/webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      DefineOptions()
    ]
  },
  // 修改输出目录到后端项目的静态资源目录
  outputDir: '/Users/mac/dkt_project/yinfeng/src/main/resources/static',
  // 修改静态资源路径
  publicPath: '/',
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        ws: false  // 禁用 WebSocket
      }
    }
  }
})
