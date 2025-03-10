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
          <van-form @submit="onPhoneSubmit">
            <van-cell-group inset>
              <van-field
                v-model="phoneForm.phone"
                name="phone"
                label="手机号"
                placeholder="请输入手机号"
                :rules="[{ required: true, pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]"
              />
              <van-field
                v-model="phoneForm.code"
                center
                clearable
                label="验证码"
                placeholder="请输入验证码"
                :rules="[{ required: true, message: '请输入验证码' }]"
              >
                <template #button>
                  <van-button
                    size="small"
                    type="primary"
                    :disabled="isCountingDown"
                    @click="sendCode"
                  >
                    {{ countDown ? `${countDown}s后重试` : '发送验证码' }}
                  </van-button>
                </template>
              </van-field>
            </van-cell-group>
            <div class="submit-btn">
              <van-button round block type="primary" native-type="submit">
                登录
              </van-button>
            </div>
          </van-form>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const activeTab = ref(0)
const countDown = ref(0)
const isCountingDown = ref(false)

const passwordForm = ref({
  username: '',
  password: ''
})

const phoneForm = ref({
  phone: '',
  code: ''
})

// 创建 axios 实例
const http = axios.create({
  baseURL: 'http://localhost:8082',
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

// 发送验证码
const sendCode = async () => {
  if (!phoneForm.value.phone) {
    showToast('请输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(phoneForm.value.phone)) {
    showToast('请输入正确的手机号')
    return
  }

  try {
    const res = await http.post('/api/auth/send-code', {
      phone: phoneForm.value.phone
    })
    if (res.data.code === 200) {
      showToast('验证码已发送')
      startCountDown()
    } else {
      showToast(res.data.message || '发送失败')
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    showToast('发送验证码失败')
  }
}

// 手机验证码登录
const onPhoneSubmit = async (values) => {
  try {
    const res = await http.post('/api/auth/login/phone', {
      phone: values.phone,
      code: values.code
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

// 倒计时
const startCountDown = () => {
  countDown.value = 60
  isCountingDown.value = true
  const timer = setInterval(() => {
    countDown.value--
    if (countDown.value <= 0) {
      clearInterval(timer)
      isCountingDown.value = false
    }
  }, 1000)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.login-form {
  padding: 20px;
}

.submit-btn {
  margin: 16px;
}
</style> 