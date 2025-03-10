<template>
  <div class="report-page">
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="我的报告" name="my">
        <div class="content">
          <van-button type="primary" block @click="handleUpload" class="upload-btn">
            上传报告
          </van-button>

          <van-list
            v-model:loading="loading"
            :finished="finished"
            finished-text="没有更多了"
            @load="onLoad"
          >
            <van-cell v-for="report in reports" :key="report.id">
              <template #title>
                <div class="report-title">{{ report.fileName }}</div>
                <div class="report-time">{{ formatDate(report.uploadTime) }}</div>
              </template>
              <template #right-icon>
                <van-tag :type="report.status === 1 ? 'success' : 'warning'">
                  {{ report.status === 1 ? '已上传' : '处理中' }}
                </van-tag>
              </template>
            </van-cell>
          </van-list>

          <van-button 
            type="info" 
            block 
            @click="generatePDF" 
            class="generate-btn"
            :disabled="!reports.length"
          >
            生成PDF报告
          </van-button>
        </div>
      </van-tab>
      <van-tab title="他人报告" name="others">
        <div class="empty-tip">暂无他人报告</div>
      </van-tab>
    </van-tabs>

    <input 
      type="file" 
      ref="fileInput"
      style="display: none"
      @change="uploadFile"
      accept=".pdf,.doc,.docx"
    >
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const activeTab = ref('my')
const reports = ref([])
const loading = ref(false)
const finished = ref(false)
const currentPage = ref(1)
const pageSize = 10
const fileInput = ref(null)

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

const getReportList = async () => {
  if (loading.value) return // 防止重复请求
  
  try {
    loading.value = true
    const res = await http.get(`/api/v1/reports`, {
      params: {
        page: currentPage.value,
        size: pageSize
      }
    })
    
    if (res.data.code === 0) {
      const newReports = res.data.data || []
      reports.value = [...reports.value, ...newReports]
      
      // 如果返回的数据少于页大小，说明没有更多数据了
      if (newReports.length < pageSize) {
        finished.value = true
      }
      currentPage.value++ // 只有在成功时才增加页码
    } else {
      finished.value = true
      showToast(res.data.message || '获取列表失败')
    }
  } catch (error) {
    console.error('获取报告列表失败:', error)
    if (error.response?.status === 403) {
      showToast('登录已过期，请重新登录')
      localStorage.removeItem('token') // 清除失效的 token
      router.push('/login')
    } else {
      showToast('获取列表失败')
    }
    finished.value = true // 出错时也标记为加载完成
  } finally {
    loading.value = false
  }
}

const onLoad = () => {
  if (!finished.value) {
    getReportList()
  }
}

// 重置列表
const resetList = () => {
  reports.value = []
  currentPage.value = 1
  finished.value = false
  loading.value = false
}

const handleUpload = () => {
  fileInput.value.click()
}

const uploadFile = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await http.post('/api/v1/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    if (res.data.code === 0) {
      showToast('上传成功')
      resetList() // 重置列表
      getReportList() // 重新加载第一页
    } else {
      showToast(res.data.message || '上传失败')
    }
  } catch (error) {
    if (error.response?.status === 403) {
      showToast('登录已过期，请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      showToast('上传失败')
      console.error('上传失败:', error)
    }
  }
}

const generatePDF = async () => {
  if (!reports.value.length) {
    showToast('暂无可生成的报告')
    return
  }

  const latestReport = reports.value[0]
  try {
    const res = await http.post(`/api/health-plan/generatepdf`, {
      reportId: latestReport.id,
      reportUrl: latestReport.fileUrl
    })
    if (res.data.code === 0) {
      showToast('PDF生成成功')
    } else {
      showToast(res.data.message || 'PDF生成失败')
    }
  } catch (error) {
    if (error.response?.status === 403) {
      showToast('登录已过期，请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      showToast('PDF生成失败')
      console.error('生成PDF失败:', error)
    }
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

onMounted(() => {
  resetList()
  getReportList()
})
</script>

<style scoped>
.report-page {
  padding-bottom: 50px;
}

.content {
  padding: 16px;
}

.upload-btn {
  margin-bottom: 16px;
}

.generate-btn {
  margin-top: 16px;
}

.report-title {
  font-size: 16px;
  margin-bottom: 4px;
}

.report-time {
  font-size: 12px;
  color: #999;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 32px 0;
}
</style> 