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

// 组件挂载时初始化微信配置
onMounted(async () => {
  if (isWeixinBrowser()) {
    try {
      console.log('开始初始化微信配置...')
      // 获取当前页面URL（去除hash部分）
      const url = window.location.href.split('#')[0]
      console.log('当前页面URL:', url)
      
      // 获取JSAPI配置
      const res = await http.get('/api/auth/wechat/jsapi-config', {
        params: { url }
      })
      
      console.log('JSAPI配置响应:', res.data)
      
      if (res.data.code === 0) {
        const config = res.data.data
        console.log('准备配置微信JSSDK:', config)
        
        // eslint-disable-next-line no-undef
        wx.config({
          debug: true, // 开启调试模式
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
  } else {
    console.log('非微信浏览器环境')
  }
})

// 定义 WeixinJSBridge 支付函数
const onBridgeReady = (params, orderNo) => {
  return () => {
    WeixinJSBridge.invoke(
      'getBrandWCPayRequest', 
      params,
      function(res) {
        if (res.err_msg === "get_brand_wcpay_request:ok") {
          console.log('支付成功响应:', res)
          showToast('支付成功')
          // 开始轮询支付结果
          checkPaymentStatus(orderNo)
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

// 处理支付
const handlePayment = async () => {
  if (loading.value) return
  
  if (!isWeixinBrowser()) {
    showToast('请在微信浏览器中打开')
    return
  }
  
  loading.value = true
  let orderNo = ''

  try {
    console.log('开始创建支付订单...')
    const token = localStorage.getItem('token')
    const auth = localStorage.getItem('Authorization')
    console.log('当前认证信息:', { token, auth })

    // 创建JSAPI支付订单
    const res = await http.post('/api/auth/wechat/payment/jsapi', null, {
      headers: {
        'Authorization': localStorage.getItem('Authorization')
      }
    })
    
    console.log('支付订单创建响应:', res.data)
    
    if (res.data.code === 200) {
      const payParams = res.data.data
      orderNo = payParams.orderNo
      console.log('获取到支付参数:', payParams)
      
      // 转换时间戳格式
      const params = {
        timeStamp: payParams.timeStamp, // 注意这里使用 timeStamp
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType,
        paySign: payParams.paySign,
        appId: payParams.appId
      }
      
      console.log('准备调起支付:', params)
      
      // 使用 WeixinJSBridge 调起支付
      if (typeof WeixinJSBridge === 'undefined') {
        if (document.addEventListener) {
          document.addEventListener('WeixinJSBridgeReady', onBridgeReady(params, orderNo), false)
        } else if (document.attachEvent) {
          document.attachEvent('WeixinJSBridgeReady', onBridgeReady(params, orderNo))
          document.attachEvent('onWeixinJSBridgeReady', onBridgeReady(params, orderNo))
        }
      } else {
        onBridgeReady(params, orderNo)()
      }
    } else {
      showToast(res.data.message || '创建支付订单失败')
    }
  } catch (error) {
    console.error('支付处理失败:', error)
    showToast('支付失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 检查支付状态
const checkPaymentStatus = async (orderNo) => {
  let retryCount = 0
  const maxRetries = 10
  const interval = 1000 // 1秒

  const check = async () => {
    try {
      console.log(`开始第${retryCount + 1}次查询支付结果 - orderNo:`, orderNo)
      const res = await http.get(`/api/auth/wechat/payment/query/${orderNo}`)
      console.log('支付状态查询结果:', res.data)

      if (res.data.code === 200) {
        const { orderStatus } = res.data.data
        console.log('订单状态:', orderStatus)
        
        if (orderStatus === 2) {
          showToast('支付成功')
          router.push('/assistant')
          return
        }
      }

      if (retryCount < maxRetries) {
        retryCount++
        console.log(`等待${interval}ms后进行第${retryCount + 1}次查询`)
        setTimeout(check, interval)
      } else {
        console.log('支付状态查询超时')
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