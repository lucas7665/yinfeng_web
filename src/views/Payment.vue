<template>
  <div class="payment-container">
    <div class="payment-card">
      <h1>升级会员</h1>
      
      <div class="price-section">
        <h2>¥99.00</h2>
        <p>每月</p>
      </div>

      <div class="benefits-section">
        <h3>会员权益</h3>
        <ul>
          <li>每月500条对话额度</li>
          <li>优先客服支持</li>
          <li>高级AI模型使用权限</li>
          <li>自定义知识库</li>
        </ul>
      </div>

      <button class="payment-button" @click="handlePayment" :disabled="loading">
        {{ loading ? '处理中...' : '立即开通' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)

// 创建 axios 实例
const http = axios.create({
  baseURL: 'https://lgj-8082.colorstoneai.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：添加 token
http.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 检查是否在微信浏览器中
const isWeixinBrowser = () => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.indexOf('micromessenger') !== -1
}

// 初始化微信配置
const initWxConfig = async () => {
  try {
    // 获取当前页面URL（去除hash部分）
    const url = window.location.href.split('#')[0]
    
    // 获取JSAPI配置
    const res = await http.get('/api/auth/wechat/jsapi-config', {
      params: { url }
    })
    
    if (res.data.code === 0) {
      const config = res.data.data
      // eslint-disable-next-line no-undef
      wx.config({
        debug: false,
        appId: config.appId,
        timestamp: config.timestamp,
        nonceStr: config.nonceStr,
        signature: config.signature,
        jsApiList: ['chooseWXPay']
      })

      // eslint-disable-next-line no-undef
      wx.ready(() => {
        console.log('微信配置成功')
      })

      // eslint-disable-next-line no-undef
      wx.error((err) => {
        console.error('微信配置失败:', err)
        showToast('微信配置失败，请刷新页面重试')
      })
    }
  } catch (error) {
    console.error('初始化微信配置失败:', error)
    showToast('初始化失败，请刷新页面重试')
  }
}

// 处理支付
const handlePayment = async () => {
  if (loading.value) return
  
  if (!isWeixinBrowser()) {
    showToast('请在微信浏览器中打开')
    return
  }
  
  loading.value = true

  try {
    // 创建JSAPI支付订单
    const res = await http.post('/api/auth/wechat/payment/jsapi')
    
    if (res.data.code === 0) {
      const payParams = res.data.data
      
      // 调起微信支付
      // eslint-disable-next-line no-undef
      wx.chooseWXPay({
        timestamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType,
        paySign: payParams.paySign,
        success: function() {
          showToast('支付成功')
          // 支付成功后跳转到助手页面
          router.push('/assistant')
        },
        fail: function(err) {
          console.error('支付失败:', err)
          showToast('支付失败，请重试')
        },
        cancel: function() {
          showToast('已取消支付')
        }
      })
    } else {
      showToast(res.data.message || '创建支付订单失败')
    }
  } catch (error) {
    console.error('支付失败:', error)
    showToast('支付失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时初始化微信配置
onMounted(() => {
  if (isWeixinBrowser()) {
    initWxConfig()
  }
})
</script>

<style scoped>
.payment-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.payment-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.price-section {
  text-align: center;
  margin-bottom: 30px;
}

.price-section h2 {
  font-size: 36px;
  color: #2c3e50;
  margin: 0;
}

.price-section p {
  color: #666;
  margin: 5px 0 0;
}

.benefits-section {
  margin-bottom: 30px;
}

.benefits-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.benefits-section ul {
  list-style: none;
  padding: 0;
}

.benefits-section li {
  padding: 10px 0;
  color: #666;
  position: relative;
  padding-left: 25px;
}

.benefits-section li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #42b983;
}

.payment-button {
  width: 100%;
  padding: 15px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.payment-button:hover {
  background-color: #3aa876;
}

.payment-button:disabled {
  background-color: #a8d5c3;
  cursor: not-allowed;
}
</style> 