<template>
  <div class="report-page">
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="我的报告" name="my">
        <div class="content">
          <van-button type="primary" block @click="handleUpload" class="upload-btn">
            上传报告
          </van-button>

          <!-- 报告列表 -->
          <div class="report-list">
            <van-cell v-for="report in reports" :key="report.id">
              <template #title>
                <div class="report-title">{{ report.fileName }}</div>
                <div class="report-time">{{ formatDate(report.uploadTime) }}</div>
              </template>
              <template #right-icon>
                <div class="cell-right">
                  <van-tag :type="report.status === 1 ? 'success' : 'warning'" class="status-tag">
                    {{ report.status === 1 ? '已上传' : '处理中' }}
                  </van-tag>
                  <van-button 
                    v-if="report.status === 1" 
                    type="primary" 
                    size="small" 
                    @click.stop="viewFile(report)"
                    class="view-btn"
                  >
                    查看
                  </van-button>
                </div>
              </template>
            </van-cell>
          </div>

          <!-- 分页器 -->
          <div class="pagination-wrapper">
            <van-empty v-if="!loading && !reports.length" description="暂无报告" />
            <van-pagination
              v-else
              v-model="currentPage"
              :total-items="total"
              :items-per-page="pageSize"
              :show-page-size="3"
              force-ellipses
              @change="onPageChange"
            />
          </div>

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

    <!-- 文件预览弹窗 -->
    <van-dialog
      v-model:show="showPreview"
      :title="currentFile?.fileName"
      class="preview-dialog"
      closeable
      close-icon="close"
    >
      <div class="preview-container">
        <div class="resize-handle" @mousedown="startResize"></div>
        <iframe 
          v-if="currentFile?.fileType === 'application/pdf'"
          :src="currentFile?.fileUrl" 
          frameborder="0"
          class="pdf-preview"
        ></iframe>
        <img 
          v-else-if="currentFile?.fileType.startsWith('image/')"
          :src="currentFile?.fileUrl" 
          class="image-preview"
        />
        <div v-else class="unsupported-preview">
          <van-button type="primary" @click="downloadFile(currentFile)">下载文件</van-button>
          <p>该文件类型不支持在线预览</p>
        </div>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const activeTab = ref('my')
const reports = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const fileInput = ref(null)

// 文件预览相关
const showPreview = ref(false)
const currentFile = ref(null)

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
  if (loading.value) return
  
  try {
    loading.value = true
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
    })

    const res = await http.get(`/api/v1/reports`, {
      params: {
        page: currentPage.value,
        size: pageSize
      }
    })
    
    if (res.data.code === 0) {
      reports.value = res.data.data || []
      total.value = res.data.total || 0
    } else {
      showToast(res.data.message || '获取列表失败')
    }
  } catch (error) {
    console.error('获取报告列表失败:', error)
    if (error.response?.status === 403) {
      showToast('登录已过期，请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      showToast('获取列表失败')
    }
  } finally {
    loading.value = false
    closeToast()
  }
}

const onPageChange = (page) => {
  currentPage.value = page
  getReportList()
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
    showLoadingToast({
      message: '上传中...',
      forbidClick: true,
    })

    const res = await http.post('/api/v1/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    if (res.data.code === 0) {
      showToast('上传成功')
      currentPage.value = 1 // 重置到第一页
      getReportList()
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
  } finally {
    closeToast()
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

const viewFile = (report) => {
  currentFile.value = report
  showPreview.value = true
}

const downloadFile = (file) => {
  if (!file?.fileUrl) return
  window.open(file.fileUrl, '_blank')
}

// 拖拽调整大小相关
const startResize = (e) => {
  e.preventDefault()
  const dialog = document.querySelector('.preview-dialog')
  const initialHeight = dialog.offsetHeight
  const initialY = e.clientY

  const handleMouseMove = (moveEvent) => {
    const deltaY = moveEvent.clientY - initialY
    const newHeight = Math.min(Math.max(initialHeight + deltaY, 400), window.innerHeight * 0.95)
    dialog.style.height = `${newHeight}px`
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

onMounted(() => {
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

.report-list {
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin: 16px 0;
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

.cell-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  margin-right: 8px;
}

.view-btn {
  font-size: 12px;
  padding: 0 12px;
}

.preview-dialog {
  width: 95%;
  height: 90vh;
  max-width: 1200px;
  resize: vertical; /* 允许垂直方向调整大小 */
  overflow: hidden;
}

.preview-dialog :deep(.van-dialog__content) {
  height: calc(100% - 56px);
  padding: 0;
  position: relative;
}

.resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: transparent;
  cursor: ns-resize;
  z-index: 1;
}

.resize-handle:hover {
  background: rgba(0, 0, 0, 0.1);
}

.preview-container {
  height: 100%;
  overflow: hidden;
  background-color: #f5f5f5;
  position: relative;
}

.pdf-preview,
.image-preview {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border: none;
}

.unsupported-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
</style> 