<template>
  <div class="login-page">
    <van-nav-bar title="登录" />
    
    <div class="login-form">
      <!-- 只有当有多个启用的登录方式时才显示标签页 -->
      <template v-if="enabledLoginTabs.length > 1">
        <van-tabs v-model:active="activeTab">
          <!-- 账号密码登录 -->
          <van-tab 
            v-if="loginConfig.password.enabled" 
            :title="loginConfig.password.title"
          >
            <van-form @submit="onPasswordSubmit">
              <van-cell-group inset>
                <van-field
                  v-model="passwordForm.username"
                  name="username"
                  :label="loginConfig.password.usernameLabel"
                  :placeholder="loginConfig.password.usernamePlaceholder"
                  :rules="[{ required: true, message: '请输入用户名' }]"
                />
                <van-field
                  v-model="passwordForm.password"
                  type="password"
                  name="password"
                  :label="loginConfig.password.passwordLabel"
                  :placeholder="loginConfig.password.passwordPlaceholder"
                  :rules="[{ required: true, message: '请输入密码' }]"
                />
              </van-cell-group>
              <div class="submit-btn">
                <van-button round block type="primary" native-type="submit">
                  {{ loginConfig.password.submitText }}
                </van-button>
              </div>
            </van-form>
          </van-tab>

          <!-- 手机验证码登录 -->
          <van-tab 
            v-if="loginConfig.sms.enabled" 
            :title="loginConfig.sms.title"
          >
            <van-form @submit="onSubmit">
              <van-cell-group inset>
                <van-field
                  v-model="phone"
                  name="phone"
                  :label="loginConfig.sms.phoneLabel"
                  :placeholder="loginConfig.sms.phonePlaceholder"
                  :rules="[{ required: true, message: '请填写手机号' }]"
                />
                <van-field
                  v-model="code"
                  name="code"
                  :label="loginConfig.sms.codeLabel"
                  :placeholder="loginConfig.sms.codePlaceholder"
                  :rules="[{ required: true, message: '请填写验证码' }]"
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
              </van-cell-group>
              <div style="margin: 16px;">
                <van-button round block type="primary" native-type="submit">
                  {{ loginConfig.sms.submitText }}
                </van-button>
              </div>
            </van-form>
          </van-tab>
        </van-tabs>
      </template>

      <!-- 如果只有一个登录方式，直接显示对应的表单 -->
      <template v-else>
        <!-- 密码登录表单 -->
        <van-form v-if="loginConfig.password.enabled" @submit="onPasswordSubmit">
          <van-cell-group inset>
            <van-field
              v-model="passwordForm.username"
              name="username"
              :label="loginConfig.password.usernameLabel"
              :placeholder="loginConfig.password.usernamePlaceholder"
              :rules="[{ required: true, message: '请输入用户名' }]"
            />
            <van-field
              v-model="passwordForm.password"
              type="password"
              name="password"
              :label="loginConfig.password.passwordLabel"
              :placeholder="loginConfig.password.passwordPlaceholder"
              :rules="[{ required: true, message: '请输入密码' }]"
            />
          </van-cell-group>
          <div class="submit-btn">
            <van-button round block type="primary" native-type="submit">
              {{ loginConfig.password.submitText }}
            </van-button>
          </div>
        </van-form>

        <!-- 短信登录表单 -->
        <van-form v-if="loginConfig.sms.enabled" @submit="onSubmit">
          <van-cell-group inset>
            <van-field
              v-model="phone"
              name="phone"
              :label="loginConfig.sms.phoneLabel"
              :placeholder="loginConfig.sms.phonePlaceholder"
              :rules="[{ required: true, message: '请填写手机号' }]"
            />
            <van-field
              v-model="code"
              name="code"
              :label="loginConfig.sms.codeLabel"
              :placeholder="loginConfig.sms.codePlaceholder"
              :rules="[{ required: true, message: '请填写验证码' }]"
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
          </van-cell-group>
          <div style="margin: 16px;">
            <van-button round block type="primary" native-type="submit">
              {{ loginConfig.sms.submitText }}
            </van-button>
          </div>
        </van-form>
      </template>

      <!-- 其他登录方式 -->
      <div v-if="loginConfig.wechat.enabled" class="other-login">
        <div class="divider">
          <span>{{ loginConfig.wechat.dividerText }}</span>
        </div>
        <div class="social-login">
          <van-button 
            round 
            icon="wechat" 
            :color="loginConfig.wechat.buttonColor" 
            class="wechat-btn"
            @click="handleWxLogin"
          >
            {{ loginConfig.wechat.buttonText }}
          </van-button>
        </div>
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

// 计算启用的登录标签页
const enabledLoginTabs = computed(() => {
  const tabs = []
  if (loginConfig.password.enabled) tabs.push('password')
  if (loginConfig.sms.enabled) tabs.push('sms')
  return tabs
})

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

// 添加一个通用的登录成功处理函数
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

// 修改账号密码登录
const onPasswordSubmit = async (values) => {
  try {
    const res = await http.post('/api/auth/login', {
      username: values.username,
      password: values.password
    })
    if (res.data.code === 0) {
      await handleLoginSuccess(res.data.data.token)
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
  
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    showToast('请输入正确的手机号')
    return
  }

  try {
    showLoadingToast({
      message: '发送中...',
      forbidClick: true,
    })

    const res = await http.post('/api/sms/send-code', {
      phone: phone.value
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

// 修改短信登录提交
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

    const res = await http.post('/api/auth/login/phone', {
      phone: phone.value,
      code: code.value
    })

    if (res.data.code === 0) {
      await handleLoginSuccess(res.data.data.token)
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

// 修改微信登录处理
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