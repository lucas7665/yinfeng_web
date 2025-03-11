<template>
  <div class="assistant-page">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ 'sidebar-hidden': !showSidebar }">
      <!-- 新建会话按钮 -->
      <div class="new-chat-btn" @click="createNewSession">
        <van-button block type="primary" icon="plus">新建会话</van-button>
      </div>

      <!-- 会话历史列表 -->
      <div class="session-list">
        <van-cell
          v-for="session in sessions"
          :key="session.id"
          :title="session.title || '新会话'"
          :class="{ active: currentSession === session.id }"
          @click="switchSession(session)"
        >
          <template #icon>
            <van-icon name="chat-o" class="session-icon" />
          </template>
        </van-cell>
      </div>
    </div>

    <!-- 聊天主界面 -->
    <div class="chat-main">
      <!-- 顶部栏 -->
      <div class="chat-header">
        <van-icon 
          name="bars" 
          class="menu-icon" 
          @click="toggleSidebar"
        />
        <span class="session-title">{{ currentSessionTitle }}</span>
      </div>

      <!-- 消息列表 -->
      <div class="message-list" ref="messageList">
        <template v-if="messages.length">
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            :class="['message-item', message.role === 'user' ? 'user-message' : 'assistant-message']"
          >
            <div class="message-content">
              <van-icon 
                :name="message.role === 'user' ? 'manager' : 'service'" 
                class="avatar-icon"
              />
              <div class="message-text">{{ message.content }}</div>
            </div>
          </div>
        </template>
        <div v-else class="empty-message">
          <van-empty description="开始新的对话吧" />
        </div>
        <!-- 加载中的消息 -->
        <div v-if="isLoading" class="message-item assistant-message">
          <div class="message-content">
            <van-icon name="service" class="avatar-icon" />
            <div class="message-text loading">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入框区域 -->
      <div class="input-area">
        <van-field
          v-model="inputMessage"
          type="textarea"
          placeholder="请输入问题..."
          rows="1"
          autosize
          @keypress.enter.prevent="sendMessage"
        >
          <template #button>
            <van-button 
              size="small" 
              type="primary" 
              :loading="isLoading"
              :disabled="!inputMessage.trim() || isLoading"
              @click="sendMessage"
            >
              发送
            </van-button>
          </template>
        </van-field>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { showToast } from 'vant'
import axios from 'axios'

const CHAT_ID = 'ff71490cf4b211efae140242ac130006'
const showSidebar = ref(true)
const sessions = ref([])
const currentSession = ref(null)
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messageList = ref(null)

const currentSessionTitle = ref('健康助手')

// 创建 axios 实例
const http = axios.create({
  baseURL: 'http://localhost:8082',
  timeout: 30000,
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

// 切换侧边栏显示
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 创建新会话
const createNewSession = async () => {
  try {
    const res = await http.post(`/api/v1/chats/${CHAT_ID}/sessions`)
    if (res.data.code === 0) {
      const sessionData = res.data.data.data  // 注意这里的数据结构
      const newSession = {
        id: sessionData.id,  // 使用正确的会话ID
        title: sessionData.name,
        createTime: sessionData.create_time
      }
      sessions.value.unshift(newSession)
      // 添加系统返回的欢迎消息
      messages.value = sessionData.messages || []
      switchSession(newSession)
    } else {
      showToast('创建会话失败')
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    showToast('创建会话失败')
  }
}

// 切换会话
const switchSession = async (session) => {
  currentSession.value = session.id
  currentSessionTitle.value = session.title
  messages.value = []
  await loadMessages(session.id)
}

// 加载会话消息历史
const loadMessages = async (sessionId) => {
  try {
    const res = await http.get(`/api/v1/chats/${CHAT_ID}/sessions/${sessionId}/messages`)
    if (res.data.code === 0) {
      messages.value = res.data.data.messages || []
      await scrollToBottom()
    }
  } catch (error) {
    console.error('加载消息失败:', error)
    showToast('加载消息失败')
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  // 如果没有当前会话，先创建一个
  if (!currentSession.value) {
    await createNewSession()
    if (!currentSession.value) return  // 如果创建失败就返回
  }

  const userMessage = inputMessage.value.trim()
  messages.value.push({
    role: 'user',
    content: userMessage
  })
  inputMessage.value = ''
  await scrollToBottom()

  isLoading.value = true
  try {
    const res = await http.post(`/api/v1/chats/${CHAT_ID}/completions`, {
      session_id: currentSession.value,
      question: userMessage
    })

    if (res.data.code === 0) {
      // 修改这里，从正确的路径获取答案
      const answer = res.data.data.data.answer
      messages.value.push({
        role: 'assistant',
        content: answer || '抱歉，我没有找到合适的答案'
      })
    } else {
      showToast(res.data.message || '发送失败')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    showToast('发送失败')
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
}

onMounted(() => {
  createNewSession()
})
</script>

<style scoped>
.assistant-page {
  height: calc(100vh - 50px);  /* 减去底部 TabBar 的高度 */
  display: flex;
  background-color: #f7f8fa;
}

.sidebar {
  width: 250px;
  background-color: #fff;
  border-right: 1px solid #ebedf0;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s;
}

.sidebar-hidden {
  transform: translateX(-100%);
  position: absolute;
  z-index: 100;
  height: 100%;
}

.new-chat-btn {
  padding: 12px;
  border-bottom: 1px solid #ebedf0;
}

.session-list {
  flex: 1;
  overflow-y: auto;
}

.session-icon {
  margin-right: 8px;
}

.active {
  background-color: #e8f3ff;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #ebedf0;
  display: flex;
  align-items: center;
}

.menu-icon {
  font-size: 24px;
  margin-right: 12px;
  cursor: pointer;
}

.session-title {
  font-size: 16px;
  font-weight: 500;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-item {
  margin-bottom: 16px;
}

.message-content {
  display: flex;
  align-items: flex-start;
  max-width: 80%;
}

.user-message {
  display: flex;
  justify-content: flex-end;
}

.user-message .message-content {
  flex-direction: row-reverse;
}

.avatar-icon {
  font-size: 24px;
  margin: 0 8px;
}

.message-text {
  background-color: #fff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  word-break: break-word;
}

.user-message .message-text {
  background-color: #007fff;
  color: #fff;
}

.input-area {
  padding: 12px;
  background-color: #fff;
  border-top: 1px solid #ebedf0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));  /* 适配 iPhone 底部安全区域 */
}

.empty-message {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin: 0 4px;
  background-color: #999;
  border-radius: 50%;
  animation: dot-flashing 1s infinite linear alternate;
}

.loading .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-flashing {
  0% {
    opacity: 0.2;
  }
  100% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    z-index: 100;
    height: calc(100vh - 50px);  /* 同样减去 TabBar 高度 */
  }

  .chat-main {
    padding-bottom: env(safe-area-inset-bottom);  /* 适配 iPhone 底部安全区域 */
  }
}
</style> 