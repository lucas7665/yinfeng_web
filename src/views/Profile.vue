<template>
  <div class="profile-page">
    <!-- 用户信息头部 -->
    <div class="user-header">
      <div class="user-info">
        <van-image
          round
          width="64"
          height="64"
          :src="userInfo.avatar || 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'"
          class="avatar"
        />
        <div class="user-name">{{ userInfo.nickname || userInfo.username || '未设置昵称' }}</div>
      </div>
      <van-button 
        type="primary" 
        size="small" 
        icon="edit"
        class="edit-btn"
        @click="handleEdit"
      >
        编辑资料
      </van-button>
    </div>

    <!-- 基本信息 -->
    <div class="info-section">
      <div class="section-title">基本信息</div>
      <van-cell-group inset>
        <van-cell title="姓名" :value="userInfo.username || '未设置'" />
        <van-cell title="手机号" :value="formatPhone(userInfo.phone) || '未绑定'" />
        <van-cell title="身高" :value="userInfo.height ? `${userInfo.height}cm` : '未设置'" />
        <van-cell title="体重" :value="userInfo.weight ? `${userInfo.weight}kg` : '未设置'" />
      </van-cell-group>
    </div>

    <!-- 健康信息 -->
    <div class="info-section">
      <div class="section-title">健康信息</div>
      <van-cell-group inset>
        <van-cell title="体检报告" :value="`${reportCount}份`" is-link to="/report" />
        <van-cell title="健康方案" :value="`${planCount}份`" is-link to="/plan" />
      </van-cell-group>
    </div>

    <!-- 退出登录 -->
    <div class="logout-section">
      <van-button 
        type="danger" 
        block 
        @click="handleLogout"
        class="logout-btn"
      >
        退出登录
      </van-button>
    </div>
  </div>

  <!-- 编辑资料弹窗 -->
  <van-dialog
    v-model:show="showEditDialog"
    title="编辑资料"
    show-cancel-button
    @confirm="handleEditConfirm"
  >
    <van-form>
      <van-cell-group inset>
        <van-field
          v-model="editForm.nickname"
          label="昵称"
          placeholder="请输入昵称"
        />
        <van-field
          v-model="editForm.height"
          label="身高"
          placeholder="请输入身高(cm)"
          type="number"
        />
        <van-field
          v-model="editForm.weight"
          label="体重"
          placeholder="请输入体重(kg)"
          type="number"
        />
      </van-cell-group>
    </van-form>
  </van-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const userInfo = ref({})
const reportCount = ref(0)
const planCount = ref(0)
const showEditDialog = ref(false)
const editForm = ref({
  nickname: '',
  height: '',
  weight: ''
})

// 创建 axios 实例
const http = axios.create({
  baseURL: 'http://localhost:8082',
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

// 获取用户信息
const getUserInfo = async () => {
  try {
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
    })

    const res = await http.get('/api/profile/info')
    if (res.data.code === 0) {
      userInfo.value = res.data.data
      // 初始化编辑表单
      editForm.value = {
        nickname: userInfo.value.nickname || '',
        height: userInfo.value.height || '',
        weight: userInfo.value.weight || ''
      }
      
      // 如果后端返回了统计数据，就使用后端数据
      // 否则暂时使用 0
      reportCount.value = res.data.data.reportCount || 0
      planCount.value = res.data.data.planCount || 0
    } else {
      showToast(res.data.message || '获取用户信息失败')
    }
  } catch (error) {
    if (error.response?.status === 403) {
      showToast('登录已过期，请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      showToast('获取用户信息失败')
      console.error('获取用户信息失败:', error)
    }
  } finally {
    closeToast()
  }
}

// 格式化手机号
const formatPhone = (phone) => {
  if (!phone) return ''
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

// 编辑资料
const handleEdit = () => {
  showEditDialog.value = true
}

// 确认编辑
const handleEditConfirm = async () => {
  try {
    showLoadingToast({
      message: '保存中...',
      forbidClick: true,
    })

    // 修改为 PUT 请求
    const res = await http.put('/api/profile/updateInfo', {
      // 按照 UpdateProfileRequest 的格式构造请求体
      nickname: editForm.value.nickname,
      height: Number(editForm.value.height) || null,  // 转换为数字
      weight: Number(editForm.value.weight) || null   // 转换为数字
    })
    
    if (res.data.code === 0) {
      showToast('保存成功')
      getUserInfo()  // 刷新用户信息
      showEditDialog.value = false  // 关闭弹窗
    } else {
      showToast(res.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    if (error.response?.status === 403 || error.response?.status === 401) {
      showToast('登录已过期，请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else if (error.response?.status === 400) {
      showToast(error.response.data.message || '输入数据有误')
      // 400 错误不关闭弹窗，让用户修改输入
    } else {
      showToast('保存失败，请重试')
      showEditDialog.value = false  // 其他错误关闭弹窗
    }
  } finally {
    closeToast()
  }
}

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
  showToast('已退出登录')
}

onMounted(() => {
  getUserInfo()  // 只调用获取用户信息的接口
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}

.user-header {
  background-color: #fff;
  padding: 24px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-size: 18px;
  font-weight: 500;
}

.info-section {
  margin-top: 12px;
  padding: 0 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  margin: 16px 0 12px;
}

.logout-section {
  margin-top: 24px;
  padding: 0 16px;
}

.logout-btn {
  margin-top: 24px;
}

.edit-btn {
  flex-shrink: 0;
}
</style> 