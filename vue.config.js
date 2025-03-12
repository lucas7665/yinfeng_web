const { defineConfig } = require('@vue/cli-service')
const DefineOptions = require('unplugin-vue-define-options/webpack')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins: [
      DefineOptions()
    ]
  },
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
