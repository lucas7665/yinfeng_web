<template>
  <div class="plan-page">
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="我的方案" name="my">
        <div class="content">
          <!-- 健康方案列表 -->
          <div class="plan-section">
            <van-empty v-if="!loading && !plans.length" description="暂无健康方案" />
            <template v-else>
              <van-cell-group inset>
                <van-cell v-for="(plan, index) in plans" :key="plan.id">
                  <template #title>
                    <div class="plan-title">
                      第{{ getDisplayIndex(index) }}次健康方案
                    </div>
                  </template>
                  <template #label>
                    <div class="plan-info">
                      <span class="plan-time">生成时间：{{ formatDate(plan.createTime) }}</span>
                    </div>
                  </template>
                  <template #right-icon>
                    <van-button 
                      type="primary" 
                      size="small" 
                      @click="viewPlan(plan, index)"
                      class="view-btn"
                    >
                      查看
                    </van-button>
                  </template>
                </van-cell>
              </van-cell-group>
              <!-- 分页器 -->
              <div class="pagination-wrapper">
                <van-pagination
                  v-model="currentPage"
                  :total-items="total"
                  :items-per-page="pageSize"
                  :show-page-size="3"
                  force-ellipses
                  @change="onPageChange"
                />
              </div>
            </template>
          </div>
        </div>
      </van-tab>
      <van-tab title="他人方案" name="others">
        <div class="empty-tip">暂无他人方案</div>
      </van-tab>
    </van-tabs>

    <!-- 预览弹窗 -->
    <van-dialog
      v-model:show="showPreview"
      :title="previewTitle"
      class="preview-dialog"
      closeable
      close-icon="close"
    >
      <div class="preview-container">
        <div class="resize-handle" @mousedown="startResize"></div>
        <iframe 
          v-if="currentPlan?.pdfUrl"
          :src="currentPlan.pdfUrl"
          frameborder="0"
          class="pdf-preview"
        ></iframe>
        <div v-else class="plan-preview">
          <div class="plan-content">
            {{ currentPlan?.content || '暂无内容' }}
          </div>
        </div>
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
const plans = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)

// 预览相关
const showPreview = ref(false)
const currentPlan = ref(null)
const previewTitle = ref('')

// 创建 axios 实例
const http = axios.create({
  baseURL: 'http://localhost:8082',
  timeout: 60000,
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

// 获取健康方案列表
const getPlanList = async () => {
  if (loading.value) return
  
  try {
    loading.value = true
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
    })

    const res = await http.get(`/api/health-plan/list`, {
      params: {
        page: currentPage.value,
        size: pageSize,
        planType: 1,
        isOwn: activeTab.value === 'my' ? 1 : 0  // 根据 tab 区分是否查询自己的方案
      }
    })
    
    if (res.data.code === 0) {
      plans.value = res.data.data || []
      total.value = res.data.total || 0
    } else {
      showToast(res.data.message || '获取列表失败')
    }
  } catch (error) {
    console.error('请求失败:', error)
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

// 监听 tab 切换
watch(activeTab, () => {
  currentPage.value = 1  // 切换 tab 时重置页码
  getPlanList()
})

// 分页变化处理
const onPageChange = (page) => {
  currentPage.value = page
  getPlanList()
}

// 获取显示序号（考虑分页）
const getDisplayIndex = (index) => {
  return (currentPage.value - 1) * pageSize + index + 1
}

// 查看方案
const viewPlan = (plan, index) => {
  currentPlan.value = plan
  previewTitle.value = `第${getDisplayIndex(index)}次健康方案`
  showPreview.value = true
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
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
  getPlanList()
})
</script>

<style scoped>
.plan-page {
  padding-bottom: 50px;
}

.plan-section {
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #323233;
}

.plan-title {
  font-size: 16px;
  color: #323233;
}

.plan-info {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.view-btn {
  font-size: 12px;
  padding: 0 12px;
}

.preview-dialog {
  width: 95%;
  height: 90vh;
  max-width: 1200px;
  resize: vertical;
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

.pdf-preview {
  width: 100%;
  height: 100%;
  border: none;
}

.plan-preview {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  background-color: #fff;
}

.plan-content {
  white-space: pre-wrap;
  line-height: 1.6;
}

.content {
  padding: 16px;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 32px 0;
}
</style> 