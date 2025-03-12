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
                    <div class="action-buttons">
                      <van-button 
                        type="primary" 
                        size="small" 
                        @click="viewPlan(plan, index)"
                        class="view-btn"
                      >
                        查看
                      </van-button>
                      <van-button 
                        type="danger" 
                        size="small" 
                        @click="handleDelete(plan)"
                        class="delete-btn"
                      >
                        删除
                      </van-button>
                    </div>
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
        <div class="content">
          <!-- 健康方案列表 -->
          <div class="plan-section">
            <van-empty v-if="!otherLoading && !otherPlans.length" description="暂无健康方案" />
            <template v-else>
              <van-cell-group inset>
                <van-cell v-for="(plan, index) in otherPlans" :key="plan.id">
                  <template #title>
                    <div class="plan-title">
                      第{{ getOtherDisplayIndex(index) }}次健康方案
                    </div>
                  </template>
                  <template #label>
                    <div class="plan-info">
                      <span class="plan-time">生成时间：{{ formatDate(plan.createTime) }}</span>
                    </div>
                  </template>
                  <template #right-icon>
                    <div class="action-buttons">
                      <van-button 
                        type="primary" 
                        size="small" 
                        @click="viewPlan(plan, index)"
                        class="view-btn"
                      >
                        查看
                      </van-button>
                      <van-button 
                        type="danger" 
                        size="small" 
                        @click="handleDelete(plan)"
                        class="delete-btn"
                      >
                        删除
                      </van-button>
                    </div>
                  </template>
                </van-cell>
              </van-cell-group>
              <!-- 分页器 -->
              <div class="pagination-wrapper">
                <van-pagination
                  v-model="otherPage"
                  :total-items="otherTotal"
                  :items-per-page="otherPageSize"
                  :show-page-size="3"
                  force-ellipses
                  @change="onOtherPageChange"
                />
              </div>
            </template>
          </div>
        </div>
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

    <!-- 删除确认弹窗 -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="删除确认"
      show-cancel-button
      @confirm="confirmDelete"
    >
      <div class="delete-confirm-content">
        确定要删除这份健康方案吗？此操作不可恢复。
      </div>
    </van-dialog>

    <!-- 方案详情弹窗 -->
    <van-dialog
      v-model:show="showDetail"
      title="方案详情"
      class="plan-dialog"
    >
      <!-- ... 现有的方案详情内容 ... -->
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

// 详情弹窗相关
const showDetail = ref(false)

// 删除相关
const showDeleteDialog = ref(false)
const planToDelete = ref(null)

// 他人方案相关变量
const otherPlans = ref([])
const otherLoading = ref(false)
const otherPage = ref(1)
const otherPageSize = 10
const otherTotal = ref(0)

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
        planType: 1  // 我的方案
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

// 获取他人方案列表
const getOtherPlans = async () => {
  if (otherLoading.value) return
  
  try {
    otherLoading.value = true
    showLoadingToast({
      message: '加载中...',
      forbidClick: true,
    })

    const res = await http.get('/api/health-plan/list', {
      params: {
        page: otherPage.value,
        size: otherPageSize,
        planType: 2  // 他人方案
      }
    })
    
    if (res.data.code === 0) {
      otherPlans.value = res.data.data || []
      otherTotal.value = res.data.total || 0
    } else {
      showToast(res.data.message || '获取列表失败')
    }
  } catch (error) {
    console.error('获取他人方案列表失败:', error)
    if (error.response?.status === 403) {
      showToast('登录已过期，请重新登录')
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      showToast('获取列表失败')
    }
  } finally {
    otherLoading.value = false
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

// 获取他人方案显示序号（考虑分页）
const getOtherDisplayIndex = (index) => {
  return (otherPage.value - 1) * otherPageSize + index + 1
}

// 修改查看方案方法
const viewPlan = (plan, index) => {
  currentPlan.value = plan
  const isOtherPlan = plan.planType === 2
  previewTitle.value = isOtherPlan 
    ? `第${getOtherDisplayIndex(index)}次健康方案`
    : `第${getDisplayIndex(index)}次健康方案`
  
  // 如果有 PDF 链接，直接显示 PDF
  if (plan.pdfUrl) {
    currentPlan.value = {
      ...plan,
      content: null,
      pdfUrl: plan.pdfUrl
    }
  } else {
    // 否则显示文本内容
    currentPlan.value = {
      ...plan,
      content: `
基本信息：
${plan.basicInfo || '无'}

鸡尾酒疗法：
${plan.cocktailTherapy || '无'}

抗衰老疗法：
${plan.antiAging || '无'}

口服营养：
${plan.oralNutrition || '无'}

生活方式指导：
${plan.lifestyleGuide || '无'}

心灵疗愈：
${plan.mentalHealing || '无'}

设备干预：
${plan.equipmentIntervention || '无'}

总结：
${plan.summary || '无'}
      `.trim()
    }
  }
  
  showPreview.value = true
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
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
const handleDelete = (plan) => {
  planToDelete.value = plan
  showDeleteDialog.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!planToDelete.value) return

  try {
    showLoadingToast({
      message: '删除中...',
      forbidClick: true,
    })

    const res = await http.delete(`/api/v1/reports/healpth/${planToDelete.value.id}`)
    
    if (res.data.code === 0) {
      showToast('删除成功')
      // 如果当前页只有一条数据且不是第一页，则跳转到上一页
      if (plans.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      getPlanList()  // 刷新列表
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
    planToDelete.value = null
  }
}

// 他人方案分页切换
const onOtherPageChange = (page) => {
  otherPage.value = page
  getOtherPlans()
}

// 监听标签页切换
watch(activeTab, (newVal) => {
  if (newVal === 'others') {
    if (otherPlans.value.length === 0) {
      getOtherPlans()
    }
  }
})

onMounted(() => {
  if (activeTab.value === 'my') {
    getPlanList()
  } else if (activeTab.value === 'others') {
    getOtherPlans()
  }
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin: 16px 0;
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

.plan-dialog {
  width: 95%;
  height: 90vh;
  max-width: 1200px;
  resize: vertical;
  overflow: hidden;
}

.plan-dialog :deep(.van-dialog__content) {
  height: calc(100% - 56px);
  padding: 0;
  position: relative;
}
</style> 