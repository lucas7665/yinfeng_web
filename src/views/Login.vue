<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Logo和标题区域 -->
      <div class="brand-section">
        <h2 class="brand-title">健康助手</h2>
        <p class="brand-desc">您的私人健康管理专家</p>
      </div>

      <!-- 登录区域 -->
      <div class="login-section">
        <!-- 多个登录方式时显示标签页 -->
        <template v-if="enabledLoginTabs.length > 1">
          <van-tabs v-model:active="activeTab" class="login-tabs">
            <!-- 账号密码登录 -->
            <van-tab v-if="loginConfig.password.enabled" :title="loginConfig.password.title">
              <van-form @submit="onPasswordSubmit" class="login-form">
                <van-field
                  v-model="passwordForm.username"
                  :label="loginConfig.password.usernameLabel"
                  :placeholder="loginConfig.password.usernamePlaceholder"
                  :rules="[{ required: true, message: '请输入用户名' }]"
                />
                <van-field
                  v-model="passwordForm.password"
                  type="password"
                  :label="loginConfig.password.passwordLabel"
                  :placeholder="loginConfig.password.passwordPlaceholder"
                  :rules="[{ required: true, message: '请输入密码' }]"
                />
                <div class="submit-btn">
                  <van-button round block type="primary" native-type="submit">
                    {{ loginConfig.password.submitText }}
                  </van-button>
                </div>
              </van-form>
            </van-tab>

            <!-- 短信验证码登录 -->
            <van-tab v-if="loginConfig.sms.enabled" :title="loginConfig.sms.title">
              <van-form @submit="onSmsSubmit" class="login-form">
                <van-field
                  v-model="smsForm.phone"
                  :label="loginConfig.sms.phoneLabel"
                  :placeholder="loginConfig.sms.phonePlaceholder"
                  :rules="[{ required: true, message: '请输入手机号' }]"
                />
                <van-field
                  v-model="smsForm.code"
                  center
                  :label="loginConfig.sms.codeLabel"
                  :placeholder="loginConfig.sms.codePlaceholder"
                  :rules="[{ required: true, message: '请输入验证码' }]"
                >
                  <template #button>
                    <van-button
                      size="small"
                      type="primary"
                      @click="getCode"
                      :disabled="!!cooldown"
                    >
                      {{ cooldown ? `${cooldown}s后重试` : loginConfig.sms.getCodeText }}
                    </van-button>
                  </template>
                </van-field>
                <div class="submit-btn">
                  <van-button round block type="primary" native-type="submit">
                    {{ loginConfig.sms.submitText }}
                  </van-button>
                </div>
              </van-form>
            </van-tab>
          </van-tabs>
        </template>

        <!-- 单个登录方式时直接显示表单 -->
        <template v-else>
          <!-- 密码登录表单 -->
          <van-form v-if="loginConfig.password.enabled" @submit="onPasswordSubmit" class="login-form">
            <van-field
              v-model="passwordForm.username"
              :label="loginConfig.password.usernameLabel"
              :placeholder="loginConfig.password.usernamePlaceholder"
              :rules="[{ required: true, message: '请输入用户名' }]"
            />
            <van-field
              v-model="passwordForm.password"
              type="password"
              :label="loginConfig.password.passwordLabel"
              :placeholder="loginConfig.password.passwordPlaceholder"
              :rules="[{ required: true, message: '请输入密码' }]"
            />
            <div class="submit-btn">
              <van-button round block type="primary" native-type="submit">
                {{ loginConfig.password.submitText }}
              </van-button>
            </div>
          </van-form>

          <!-- 短信登录表单 -->
          <van-form v-if="loginConfig.sms.enabled" @submit="onSmsSubmit" class="login-form">
            <van-field
              v-model="smsForm.phone"
              :label="loginConfig.sms.phoneLabel"
              :placeholder="loginConfig.sms.phonePlaceholder"
              :rules="[{ required: true, message: '请输入手机号' }]"
            />
            <van-field
              v-model="smsForm.code"
              center
              :label="loginConfig.sms.codeLabel"
              :placeholder="loginConfig.sms.codePlaceholder"
              :rules="[{ required: true, message: '请输入验证码' }]"
            >
              <template #button>
                <van-button
                  size="small"
                  type="primary"
                  @click="getCode"
                  :disabled="!!cooldown"
                >
                  {{ cooldown ? `${cooldown}s后重试` : loginConfig.sms.getCodeText }}
                </van-button>
              </template>
            </van-field>
            <div class="submit-btn">
              <van-button round block type="primary" native-type="submit">
                {{ loginConfig.sms.submitText }}
              </van-button>
            </div>
          </van-form>
        </template>

        <!-- 微信登录按钮 -->
        <template v-if="loginConfig.wechat.enabled">
          <div :class="['wechat-login', { 'with-divider': hasOtherLoginMethods }]">
            <div v-if="hasOtherLoginMethods" class="divider">
              <span>其他登录方式</span>
            </div>
            <van-button 
              round 
              block
              icon="wechat" 
              :color="loginConfig.wechat.buttonColor" 
              class="wechat-btn"
              @click="handleWxLogin"
            >
              {{ loginConfig.wechat.buttonText }}
            </van-button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { loginConfig } from '@/config/loginConfig'

const router = useRouter()
const activeTab = ref(0)
const cooldown = ref(0)

// 表单数据
const passwordForm = ref({
  username: '',
  password: ''
})

const smsForm = ref({
  phone: '',
  code: ''
})

// 计算启用的登录标签页
const enabledLoginTabs = computed(() => {
  const tabs = []
  if (loginConfig.password.enabled) tabs.push('password')
  if (loginConfig.sms.enabled) tabs.push('sms')
  return tabs
})

// 判断是否有其他登录方式
const hasOtherLoginMethods = computed(() => {
  return loginConfig.password.enabled || loginConfig.sms.enabled
})

// 创建 axios 实例
const http = axios.create({
  baseURL: 'https://lgj-8082.colorstoneai.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 处理登录成功
const handleLoginSuccess = async (token) => {
  localStorage.setItem('token', token)
  showToast('登录成功')
  
  // 检查是否有待处理的支付
  const pendingGroupId = localStorage.getItem('pendingPaymentGroupId')
  if (pendingGroupId) {
    localStorage.removeItem('pendingPaymentGroupId')
    await router.push(`/payment/${pendingGroupId}`)
  } else {
    // 检查是否有保存的重定向路径
    const redirectPath = localStorage.getItem('loginRedirectPath')
    if (redirectPath) {
      localStorage.removeItem('loginRedirectPath')
      await router.push(redirectPath)
    } else {
      await router.push('/report')
    }
  }
}

// 密码登录提交
const onPasswordSubmit = async (values) => {
  try {
    showLoadingToast({
      message: '登录中...',
      forbidClick: true,
    })

    const res = await http.post('/api/auth/login', {
      username: passwordForm.value.username,
      password: passwordForm.value.password
    })

    if (res.data.code === 0) {
      await handleLoginSuccess(res.data.data.token)
    } else {
      showToast(res.data.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    showToast('登录失败')
  } finally {
    closeToast()
  }
}

// 获取验证码
const getCode = async () => {
  if (!smsForm.value.phone) {
    showToast('请先输入手机号')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(smsForm.value.phone)) {
    showToast('请输入正确的手机号')
    return
  }

  try {
    showLoadingToast({
      message: '发送中...',
      forbidClick: true,
    })

    const res = await http.post('/api/sms/send-code', {
      phone: smsForm.value.phone
    })

    if (res.data.code === 0) {
      showToast('验证码已发送')
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

// 短信登录提交
const onSmsSubmit = async () => {
  try {
    showLoadingToast({
      message: '登录中...',
      forbidClick: true,
    })

    const res = await http.post('/api/auth/login/phone', {
      phone: smsForm.value.phone,
      code: smsForm.value.code
    })

    if (res.data.code === 0) {
      await handleLoginSuccess(res.data.data.token)
    } else {
      showToast(res.data.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    showToast('登录失败')
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

    // 获取待处理的群组ID和重定向路径
    const pendingGroupId = localStorage.getItem('pendingPaymentGroupId')
    const redirectPath = localStorage.getItem('loginRedirectPath')
    
    const res = await http.get('/api/auth/wechat/auth-url', {
      params: {
        groupId: pendingGroupId,
        redirectPath: redirectPath
      }
    })
    
    if (res.data.code === 200) {
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
  background: linear-gradient(to bottom, #f8f8f8, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.brand-section {
  text-align: center;
  margin-bottom: 20px;
}

.brand-title {
  font-size: 32px;
  color: #333;
  margin-bottom: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.brand-desc {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
}

.login-section {
  width: 100%;
  padding: 0 20px;
}

.login-tabs {
  background: transparent;
}

.login-form {
  margin-top: 20px;
}

.submit-btn {
  margin-top: 24px;
}

.wechat-login {
  margin-top: 20px;
}

.wechat-login.with-divider {
  margin-top: 30px;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #999;
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ebedf0;
  margin: 0 16px;
}

.wechat-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 6px 16px rgba(7, 193, 96, 0.2);
  transition: all 0.3s ease;
}

.wechat-btn:active {
  transform: translateY(1px);
  box-shadow: 0 3px 8px rgba(7, 193, 96, 0.2);
}

.wechat-btn :deep(.van-button__icon) {
  font-size: 20px;
  margin-right: 8px;
}

:deep(.van-tabs__line) {
  background-color: #07c160;
}

:deep(.van-tab--active) {
  color: #07c160;
}

:deep(.van-field__label) {
  width: 60px;
}
</style> 