<template>
  <div class="callback-page">
    <van-loading size="24px" vertical>登录处理中...</van-loading>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

onMounted(async () => {
  const { code } = route.query
  
  if (!code) {
    showToast('登录失败，请重试')
    router.push('/login')
    return
  }

  try {
    const http = axios.create({
      baseURL: 'https://lgj-8082.colorstoneai.com',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const res = await http.get(`/api/auth/wechat/callback?code=${code}`)
    console.log('微信回调响应:', res.data)
    
    if (res.data.code === 200) {
      const { token, user } = res.data.data
      console.log('获取到的token和用户信息:', { token, user })
      
      localStorage.setItem('token', token)
      localStorage.setItem('Authorization', `Bearer ${token}`)
      localStorage.setItem('userInfo', JSON.stringify(user))
      
      showToast('登录成功')
      await router.push('/report')
    } else {
      showToast(res.data.message || '登录失败')
      await router.push('/login')
    }
  } catch (error) {
    console.error('微信登录回调处理失败:', error)
    showToast('登录失败，请重试')
    await router.push('/login')
  }
})
</script>

<style scoped>
.callback-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f5ff;
}
</style> 