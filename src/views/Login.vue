<template>
  <div class="login-page">
    <van-nav-bar title="登录" />
    
    <div class="login-form">
      <van-tabs v-model:active="activeTab">
        <!-- 账号密码登录 -->
        <van-tab title="账号密码登录">
          <van-form @submit="onPasswordSubmit">
            <van-cell-group inset>
              <van-field
                v-model="passwordForm.username"
                name="username"
                label="用户名"
                placeholder="请输入用户名"
                :rules="[{ required: true, message: '请输入用户名' }]"
              />
              <van-field
                v-model="passwordForm.password"
                type="password"
                name="password"
                label="密码"
                placeholder="请输入密码"
                :rules="[{ required: true, message: '请输入密码' }]"
              />
            </van-cell-group>
            <div class="submit-btn">
              <van-button round block type="primary" native-type="submit">
                登录
              </van-button>
            </div>
          </van-form>
        </van-tab>

        <!-- 手机验证码登录 -->
        <van-tab title="验证码登录">
          <van-form @submit="onSubmit">
            <van-cell-group inset>
              <van-field
                v-model="phone"
                name="phone"
                label="手机号"
                placeholder="请输入手机号"
                :rules="[{ required: true, message: '请填写手机号' }]"
              />
              <van-field
                v-model="code"
                name="code"
                label="验证码"
                placeholder="请输入验证码"
                :rules="[{ required: true, message: '请填写验证码' }]"
              >
                <template #button>
                  <van-button 
                    size="small" 
                    type="primary" 
                    @click="getCode"
                    :disabled="!!cooldown"
                  >
                    {{ cooldown ? `${cooldown}s后重试` : '获取验证码' }}
                  </van-button>
                </template>
              </van-field>
            </van-cell-group>
            <div style="margin: 16px;">
              <van-button round block type="primary" native-type="submit">
                登录
              </van-button>
            </div>
          </van-form>
        </van-tab>
      </van-tabs>

      <!-- 添加微信登录按钮 -->
      <div class="other-login">
        <div class="divider">
          <span>其他登录方式</span>
        </div>
        <div class="social-login">
          <van-button 
            round 
            icon="wechat" 
            color="#07c160" 
            class="wechat-btn"
            @click="handleWxLogin"
          >
            微信登录
          </van-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const activeTab = ref(0)
const phone = ref('')
const code = ref('')
const cooldown = ref(0)

const passwordForm = ref({
  username: '',
  password: ''
})

// 创建 axios 实例
const http = axios.create({
  baseURL: 'https://lgj-8082.colorstoneai.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 账号密码登录
const onPasswordSubmit = async (values) => {
  try {
    const res = await http.post('/api/auth/login', {
      username: values.username,
      password: values.password
    })
    if (res.data.code === 0) {
      // 保存 token
      localStorage.setItem('token', res.data.data.token)
      showToast('登录成功')
      // 确保异步操作完成后再跳转
      await router.push('/report')
    } else {
      showToast(res.data.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    showToast('登录失败')
  }
}

// 获取验证码
const getCode = async () => {
  if (!phone.value) {
    showToast('请先输入手机号')
    return
  }
  
  // 验证手机号格式
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    showToast('请输入正确的手机号')
    return
  }

  try {
    showLoadingToast({
      message: '发送中...',
      forbidClick: true,
    })

    // 修改为正确的发送验证码接口
    const res = await http.post('/api/sms/send-code', {
      phone: phone.value
    })

    if (res.data.code === 0) {
      showToast('验证码已发送')
      // 开始倒计时
      cooldown.value = 60
      const timer = setInterval(() => {
        cooldown.value--
        if (cooldown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      showToast(res.data.message || '发送失败')
    }
  } catch (error) {
    showToast('发送失败')
    console.error('发送验证码失败:', error)
  } finally {
    closeToast()
  }
}

// 提交登录
const onSubmit = async () => {
  if (!phone.value || !code.value) {
    showToast('请输入手机号和验证码')
    return
  }

  try {
    showLoadingToast({
      message: '登录中...',
      forbidClick: true,
    })

    // 直接调用登录接口，传入手机号和验证码
    const res = await http.post('/api/auth/login/phone', {
      phone: phone.value,
      code: code.value  // 登录时需要传验证码
    })

    if (res.data.code === 0) {
      localStorage.setItem('token', res.data.data.token)
      showToast('登录成功')
      router.push('/')
    } else {
      showToast(res.data.message || '登录失败')
    }
  } catch (error) {
    showToast('登录失败')
    console.error('登录失败:', error)
  } finally {
    closeToast()
  }
}

// 微信登录处理
const handleWxLogin = async () => {
  try {
    showLoadingToast({
      message: '正在跳转...',
      forbidClick: true,
    })

    // 获取微信授权URL
    const res = await http.get('/api/auth/wechat/auth-url')
    
    if (res.data.code === 200) {
      // 跳转到微信授权页面
      window.location.href = res.data.data
    } else {
      showToast('获取微信登录链接失败')
    }
  } catch (error) {
    console.error('微信登录失败:', error)
    showToast('微信登录失败，请重试')
  } finally {
    closeToast()
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #f0f5ff;
  padding: 20px;
}

.login-form {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-top: 20px;
}

.submit-btn {
  margin: 16px;
}

.other-login {
  margin-top: 24px;
  padding: 0 16px;
}

.divider {
  display: flex;
  align-items: center;
  color: #999;
  font-size: 14px;
  margin: 16px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ebedf0;
  margin: 0 16px;
}

.social-login {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.wechat-btn {
  width: 80%;
  height: 44px;
}
</style> 