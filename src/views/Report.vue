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
              <template #icon>
                <van-radio 
                  :name="report.id" 
                  v-model="selectedReportId"
                  class="report-radio"
                />
              </template>
              <template #title>
                <div class="report-title">{{ report.fileName }}</div>
                <div class="report-time">{{ formatDate(report.uploadTime) }}</div>
              </template>
              <template #right-icon>
                <div class="cell-right">
                  <van-tag :type="report.pdfGenerated === 1 ? 'success' : 'warning'" class="status-tag">
                    {{ report.pdfGenerated === 1 ? '已生成' : '已上传' }}
                  </van-tag>
                  <van-button 
                    type="primary" 
                    size="small" 
                    @click.stop="viewFile(report)"
                    class="view-btn"
                  >
                    查看
                  </van-button>
                  <van-button 
                    type="danger" 
                    size="small" 
                    @click.stop="handleDelete(report)"
                    class="delete-btn"
                  >
                    删除
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
            :disabled="!selectedReportId"
          >
            生成PDF报告
          </van-button>
        </div>
      </van-tab>
      <van-tab title="他人报告" name="others">
        <div class="content">
          <van-button type="primary" block @click="handleUpload" class="upload-btn">
            上传报告
          </van-button>

          <!-- 报告列表 -->
          <div class="report-list">
            <van-cell v-for="report in otherReports" :key="report.id">
              <template #icon>
                <van-radio 
                  :name="report.id" 
                  v-model="otherSelectedReportId"
                  class="report-radio"
                />
              </template>
              <template #title>
                <div class="report-title">{{ report.fileName }}</div>
                <div class="report-time">{{ formatDate(report.uploadTime) }}</div>
              </template>
              <template #right-icon>
                <div class="cell-right">
                  <van-tag :type="report.pdfGenerated === 1 ? 'success' : 'warning'" class="status-tag">
                    {{ report.pdfGenerated === 1 ? '已生成' : '已上传' }}
                  </van-tag>
                  <van-button 
                    type="primary" 
                    size="small" 
                    @click.stop="viewFile(report)"
                    class="view-btn"
                  >
                    查看
                  </van-button>
                  <van-button 
                    type="danger" 
                    size="small" 
                    @click.stop="handleDelete(report)"
                    class="delete-btn"
                  >
                    删除
                  </van-button>
                </div>
              </template>
            </van-cell>
          </div>

          <!-- 分页器 -->
          <div class="pagination-wrapper">
            <van-empty v-if="!otherLoading && !otherReports.length" description="暂无报告" />
            <van-pagination
              v-else
              v-model="otherPage"
              :total-items="otherTotal"
              :items-per-page="otherPageSize"
              :show-page-size="3"
              force-ellipses
              @change="onOtherPageChange"
            />
          </div>

          <van-button 
            type="info" 
            block 
            @click="generateOtherPDF" 
            class="generate-btn"
            :disabled="!otherSelectedReportId"
          >
            生成PDF报告
          </van-button>
        </div>
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

    <!-- 删除确认弹窗 -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除确认"
      show-cancel-button
      @confirm="confirmDelete"
    >
      <div class="delete-confirm-content">
        确定要删除这份报告吗？此操作不可恢复。
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
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

// 单选框相关
const selectedReportId = ref(null)

// 删除相关
const showDeleteDialog = ref(false)
const reportToDelete = ref(null)

// 他人报告相关变量
const otherReports = ref([])
const otherLoading = ref(false)
const otherPage = ref(1)
const otherPageSize = 10
const otherTotal = ref(0)
const otherSelectedReportId = ref(null)

// 创建 axios 实例
const http = axios.create({
  baseURL: 'https://lgj-8082.colorstoneai.com',
  timeout: 60000,  // 增加到 60 秒
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
        size: pageSize,
        reportType: 1  // 修改为reportType=1 表示我的报告
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
  selectedReportId.value = null  // 清除选择
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
  // 根据当前标签页确定报告类型: 'my' -> 1, 'others' -> 2
  const reportType = activeTab.value === 'my' ? 1 : 2
  formData.append('reportType', reportType)

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
      
      // 根据当前标签页刷新对应的列表
      if (activeTab.value === 'my') {
        currentPage.value = 1 // 重置到第一页
        getReportList()
      } else {
        otherPage.value = 1 // 重置到第一页
        getOtherReports()
      }
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
    // 清空文件输入，确保可以重复上传同一个文件
    fileInput.value.value = ''
  }
}

const generatePDF = async () => {
  if (!selectedReportId.value) {
    showToast('请先选择一份报告')
    return
  }

  const selectedReport = reports.value.find(report => report.id === selectedReportId.value)
  if (!selectedReport) {
    showToast('所选报告不存在')
    return
  }

  try {
    showLoadingToast({
      message: '生成中...',
      forbidClick: true,
      duration: 0  // 设置为 0 表示不自动关闭
    })

    // 使用 URLSearchParams 构建表单数据
    const params = new URLSearchParams()
    params.append('reportId', selectedReport.id)
    params.append('reportUrl', selectedReport.fileUrl)
    params.append('reportType', '1')  // 我的报告类型为1

    const res = await http.post('/api/health-plan/generatepdf', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 120000  // 为生成 PDF 单独设置 120 秒超时
    })
    
    if (res.data.code === 0) {
      showToast('PDF生成成功')
      getReportList() // 刷新列表，更新状态
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
  } finally {
    closeToast()
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

// 处理删除按钮点击
const handleDelete = (report) => {
  reportToDelete.value = report
  showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!reportToDelete.value) return

  try {
    showLoadingToast({
      message: '删除中...',
      forbidClick: true,
    })

    const res = await http.delete(`/api/v1/reports/${reportToDelete.value.id}`)
    
    if (res.data.code === 0) {
      showToast('删除成功')
      // 如果当前页只有一条数据且不是第一页，则跳转到上一页
      if (reports.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      getReportList()  // 刷新列表
    } else {
      showToast(res.data.message || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    if (error.response?.status === 403 || error.response?.status === 401) {
      showToast('登录已过期，请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      showToast('删除失败，请重试')
    }
  } finally {
    closeToast()
    reportToDelete.value = null
  }
}

// 获取他人报告列表
const getOtherReports = async () => {
  if (otherLoading.value) return
  
  try {
    otherLoading.value = true
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
    })

    const res = await http.get(`/api/v1/reports`, {
      params: {
        page: otherPage.value,
        size: otherPageSize,
        reportType: 2  // 修改为reportType=2 表示他人报告
      }
    })
    
    if (res.data.code === 0) {
      otherReports.value = res.data.data || []
      otherTotal.value = res.data.total || 0
    } else {
      showToast(res.data.message || '获取列表失败')
    }
  } catch (error) {
    console.error('获取他人报告列表失败:', error)
    showToast('获取列表失败')
  } finally {
    otherLoading.value = false
    closeToast()
  }
}

// 他人报告分页切换
const onOtherPageChange = (page) => {
  otherPage.value = page
  otherSelectedReportId.value = null  // 清除选择
  getOtherReports()
}

// 生成他人报告PDF
const generateOtherPDF = async () => {
  if (!otherSelectedReportId.value) {
    showToast('请先选择一份报告')
    return
  }

  const selectedReport = otherReports.value.find(report => report.id === otherSelectedReportId.value)
  if (!selectedReport) {
    showToast('所选报告不存在')
    return
  }

  try {
    showLoadingToast({
      message: '生成中...',
      forbidClick: true,
      duration: 0
    })

    const params = new URLSearchParams()
    params.append('reportId', selectedReport.id)
    params.append('reportUrl', selectedReport.fileUrl)
    params.append('reportType', '2')  // 他人报告类型为2

    const res = await http.post('/api/health-plan/generatepdf', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 120000
    })
    
    if (res.data.code === 0) {
      showToast('PDF生成成功')
      getOtherReports() // 刷新列表，更新状态
    } else {
      showToast(res.data.message || 'PDF生成失败')
    }
  } catch (error) {
    console.error('生成PDF失败:', error)
    showToast('PDF生成失败')
  } finally {
    closeToast()
  }
}

// 监听标签页切换
watch(activeTab, (newVal) => {
  if (newVal === 'others') {
    // 切换到他人报告标签页时，如果还没有数据就加载数据
    if (otherReports.value.length === 0) {
      getOtherReports()
    }
  }
})

// 修改初始化加载
onMounted(() => {
  // 根据当前标签页加载对应数据
  if (activeTab.value === 'my') {
    getReportList()
  } else if (activeTab.value === 'others') {
    getOtherReports()
  }
})
</script>

<style scoped>
.report-page {
  min-height: calc(100vh - 50px);
  background-color: #f0f5ff;  /* 改为浅蓝色 */
  padding-bottom: 50px;
}

.content {
  padding: 12px;
}

.upload-btn,
.generate-btn {
  margin: 12px 0;
}

.report-list {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin: 12px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin: 16px 0;
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

.view-btn,
.delete-btn {
  font-size: 12px;
  padding: 0 12px;
}

.delete-btn {
  margin-left: 8px;
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

.report-radio {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.delete-confirm-content {
  padding: 16px;
  text-align: center;
  color: #666;
}

.search-bar {
  padding: 16px;
}

.report-icon {
  margin-left: 8px;
}
</style> 