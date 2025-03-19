<template>
  <div class="profile-page">
    <!-- 用户信息头部 -->
    <div class="user-header">
      <div class="user-info">
        <van-image
          round
          width="64"
          height="64"
          :src="userInfo.avatar || defaultAvatars[0]"
          class="avatar"
          @click="showAvatarDialog = true"
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
        <van-cell title="姓名" :value="userInfo.realName || '未设置'" />
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
          v-model="editForm.realName"
          label="姓名"
          placeholder="请输入姓名"
        />
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

  <!-- 头像选择弹窗 -->
  <van-dialog
    v-model:show="showAvatarDialog"
    title="选择头像"
    show-cancel-button
    @confirm="handleAvatarConfirm"
  >
    <div class="avatar-list">
      <div 
        v-for="(avatar, index) in defaultAvatars" 
        :key="index"
        class="avatar-item"
        :class="{ active: selectedAvatar === avatar }"
        @click="selectedAvatar = avatar"
      >
        <van-image
          round
          width="60"
          height="60"
          :src="avatar"
        />
      </div>
    </div>
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
  realName: '',
  nickname: '',
  height: '',
  weight: ''
})

// 修改默认头像列表为在线生成的头像
const defaultAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=ffd5dc'
]

// 头像选择相关
const showAvatarDialog = ref(false)
const selectedAvatar = ref('')

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

// 获取统计信息
const getStatistics = async () => {
  try {
    const res = await http.get('/api/v1/reports/healpth/count')
    if (res.data.code === 0) {  // 修改这里，判断 code === 0
      reportCount.value = res.data.data.reportFileCount || 0
      planCount.value = res.data.data.healthReportCount || 0
    } else {
      console.error('获取统计信息失败:', res.data.message)
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

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
        realName: userInfo.value.realName || '',
        nickname: userInfo.value.nickname || '',
        height: userInfo.value.height || '',
        weight: userInfo.value.weight || ''
      }
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

    const res = await http.put('/api/profile/updateInfo', {
      realName: editForm.value.realName,
      nickname: editForm.value.nickname,
      height: Number(editForm.value.height) || null,
      weight: Number(editForm.value.weight) || null
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

// 确认头像选择
const handleAvatarConfirm = async () => {
  if (!selectedAvatar.value) {
    showToast('请选择头像')
    return
  }

  try {
    showLoadingToast({
      message: '保存中...',
      forbidClick: true,
    })

    const res = await http.put('/api/profile/updateInfo', {
      avatar: selectedAvatar.value
    })
    
    if (res.data.code === 0) {
      showToast('头像更新成功')
      getUserInfo()  // 刷新用户信息
    } else {
      showToast(res.data.message || '更新失败')
    }
  } catch (error) {
    console.error('更新头像失败:', error)
    if (error.response?.status === 403 || error.response?.status === 401) {
      showToast('登录已过期，请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      showToast('更新失败，请重试')
    }
  } finally {
    closeToast()
  }
}

onMounted(() => {
  getUserInfo()
  getStatistics()  // 单独调用获取统计信息
})
</script>

<style scoped>
.profile-page {
  min-height: calc(100vh - 50px);
  background-color: #f0f5ff;  /* 改为浅蓝色 */
  padding: 12px;
}

.user-header {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px 16px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;  /* 让编辑按钮靠右 */
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;  /* 添加这行，让用户信息占据剩余空间 */
}

.user-name {
  font-size: 18px;
  font-weight: 500;
}

.info-section {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 12px;
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
  flex-shrink: 0;  /* 确保按钮不会被压缩 */
  margin-left: auto;  /* 添加这行，强制按钮靠右 */
}

.avatar {
  cursor: pointer;
}

.avatar-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
}

.avatar-item {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.avatar-item:hover {
  background-color: #f5f5f5;
}

.avatar-item.active {
  background-color: #e8f3ff;
  border: 2px solid #1989fa;
}
</style> 