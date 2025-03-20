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
          <li>增加对话额度</li>
          <li>优先对话支持</li>
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
import { showToast, showLoadingToast, showDialog, closeToast } from 'vant'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const groupId = ref('')

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

// 从URL路径中提取群组ID
const extractGroupIdFromPath = () => {
  const path = window.location.pathname
  const match = path.match(/\/payment\/(\d+)/)
  if (match && match[1]) {
    return match[1]
  }
  return null
}

// 组件挂载时初始化
onMounted(async () => {
  // 获取群组ID
  const pathGroupId = extractGroupIdFromPath()
  if (pathGroupId) {
    groupId.value = pathGroupId
    console.log('从URL路径中获取到群组ID:', pathGroupId)
    
    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      console.log('未登录状态，保存群组ID并跳转到登录页')
      localStorage.setItem('pendingPaymentGroupId', pathGroupId)
      router.push('/login')
      return
    }
  }
  
  if (isWeixinBrowser()) {
    try {
      // 获取当前页面URL（去除hash部分）
      const url = window.location.href.split('#')[0]
      console.log('当前页面URL:', url)
      
      // 获取JSAPI配置
      const res = await http.get('/api/auth/wechat/jsapi-config', {
        params: { url }
      })
      
      if (res.data.code === 0 || res.data.code === 200) {
        const config = res.data.data
        console.log('准备配置微信JSSDK:', config)
        
        // eslint-disable-next-line no-undef
        wx.config({
          debug: false, // 关闭调试模式
          appId: config.appId,
          timestamp: config.timestamp,
          nonceStr: config.nonceStr,
          signature: config.signature,
          jsApiList: [
            'checkJsApi',
            'chooseWXPay',
            'updateAppMessageShareData',
            'updateTimelineShareData'
          ]
        })

        // eslint-disable-next-line no-undef
        wx.ready(() => {
          console.log('微信配置成功，开始检查API是否可用')
          // eslint-disable-next-line no-undef
          wx.checkJsApi({
            jsApiList: ['chooseWXPay'],
            success: function(res) {
              console.log('API检查结果:', res)
            }
          })
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
})

// 定义 WeixinJSBridge 支付函数
const onBridgeReady = (params, orderNo, groupId) => {
  return () => {
    WeixinJSBridge.invoke(
      'getBrandWCPayRequest', 
      params,
      function(res) {
        if (res.err_msg === "get_brand_wcpay_request:ok") {
          console.log('支付成功响应:', res)
          showToast('支付成功')
          // 开始轮询支付结果
          checkPaymentStatus(orderNo, groupId)
        } else if (res.err_msg === "get_brand_wcpay_request:cancel") {
          console.log('用户取消支付')
          showToast('已取消支付')
        } else {
          console.error('支付失败:', res)
          showToast('支付失败，请重试')
        }
      }
    )
  }
}

// 处理微信授权
const handleWechatAuth = async () => {
  try {
    showLoadingToast({
      message: '正在跳转授权...',
      forbidClick: true,
    })

    const res = await http.get('/api/auth/wechat/auth-url', {
      params: {
        groupId: groupId.value, // 传递群组ID
        redirect: window.location.href // 传递当前完整URL作为回调
      }
    })
    
    if (res.data.code === 200) {
      // 保存群组ID到localStorage，以便授权回调后恢复
      if (groupId.value) {
        localStorage.setItem('pendingPaymentGroupId', groupId.value)
      }
      window.location.href = res.data.data
    } else {
      showToast(res.data.message || '获取授权链接失败')
    }
  } catch (error) {
    console.error('获取授权链接失败:', error)
    showToast('获取授权链接失败，请重试')
  } finally {
    closeToast()
  }
}

// 处理支付
const handlePayment = async () => {
  if (loading.value) return
  
  loading.value = true
  let orderNo = ''

  try {
    console.log('开始创建支付订单...群组ID:', groupId.value)
    const res = await http.post('/api/auth/wechat/payment/jsapi', null, {
      params: {
        groupId: groupId.value
      }
    })
    
    if (res.data.code === 200) {
      const payParams = res.data.data
      orderNo = payParams.orderNo
      const responseGroupId = payParams.groupId || groupId.value
      
      if (!isWeixinBrowser()) {
        showDialog({
          title: '提示',
          message: '请在微信浏览器中打开进行支付',
          confirmButtonText: '我知道了'
        })
        return
      }

      const params = {
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType,
        paySign: payParams.paySign,
        appId: payParams.appId
      }
      
      if (typeof WeixinJSBridge === 'undefined') {
        if (document.addEventListener) {
          document.addEventListener('WeixinJSBridgeReady', onBridgeReady(params, orderNo, responseGroupId), false)
        } else if (document.attachEvent) {
          document.attachEvent('WeixinJSBridgeReady', onBridgeReady(params, orderNo, responseGroupId))
          document.attachEvent('onWeixinJSBridgeReady', onBridgeReady(params, orderNo, responseGroupId))
        }
      } else {
        onBridgeReady(params, orderNo, responseGroupId)()
      }
    } else if (res.data.code === 400 && res.data.message === '用户未绑定微信openId') {
      handleWechatAuth()
    } else if (res.data.code === 401) {
      handleWechatAuth()
    } else {
      showToast(res.data.message || '创建支付订单失败')
    }
  } catch (error) {
    console.error('支付处理失败:', error)
    if (error.response?.status === 401) {
      handleWechatAuth()
    } else {
      showToast('支付失败，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}

// 检查支付状态
const checkPaymentStatus = async (orderNo, groupId) => {
  let retryCount = 0
  const maxRetries = 10
  const interval = 1000

  const check = async () => {
    try {
      const res = await http.get(`/api/auth/wechat/payment/query/${orderNo}`)
      
      if (res.data.code === 200) {
        const { orderStatus } = res.data.data
        
        if (orderStatus === 2) {
          showToast('支付成功')
          if (groupId) {
            router.push(`/group/${groupId}`)
          } else {
            router.push('/assistant')
          }
          return
        }
      }

      if (retryCount < maxRetries) {
        retryCount++
        setTimeout(check, interval)
      } else {
        showToast('支付结果确认中，请稍后查看订单')
      }
    } catch (error) {
      console.error('查询支付状态失败:', error)
    }
  }

  check()
}
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