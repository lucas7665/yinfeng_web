<template>
  <van-tabbar v-model="active" route>
    <van-tabbar-item icon="chat-o" to="/assistant">健康助手</van-tabbar-item>
    <van-tabbar-item icon="notes-o" to="/report">体检报告</van-tabbar-item>
    <van-tabbar-item icon="todo-list-o" to="/plan">健康方案</van-tabbar-item>
    <van-tabbar-item icon="user-o" to="/profile">个人中心</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
// 不需要导入 Tabbar 和 TabbarItem，因为已经在 main.js 中全局注册了

const route = useRoute()
const active = ref(0)

// 根据当前路由设置激活的标签
watch(() => route.path, (path) => {
  switch (path) {
    case '/assistant':
      active.value = 0
      break
    case '/report':
      active.value = 1
      break
    case '/plan':
      active.value = 2
      break
    case '/profile':
      active.value = 3
      break
  }
}, { immediate: true })
</script> 