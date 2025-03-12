<template>
  <div class="assistant-page">
    <!-- 遮罩层 -->
    <div 
      v-show="showSidebar" 
      class="sidebar-overlay"
      @click="toggleSidebar"
    ></div>

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
          :title="formatSessionTitle(session)"
          :class="{ active: currentSession === session.id }"
          @click="switchSession(session)"
        >
          <template #icon>
            <van-icon name="chat-o" class="session-icon" />
          </template>
          <template #right-icon>
            <van-icon 
              name="delete-o" 
              class="delete-icon"
              @click.stop="confirmDelete(session)"
            />
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
          :class="{ 'menu-icon-active': showSidebar }"
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
              <div class="message-text">
                <!-- 用户消息直接显示文本 -->
                <template v-if="message.role === 'user'">
                  {{ message.content }}
                </template>
                <!-- AI 回复使用 Markdown 渲染 -->
                <div 
                  v-else 
                  class="markdown-content"
                  v-html="renderMarkdown(message.content)"
                ></div>
              </div>
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
import { showToast, showDialog } from 'vant'
import axios from 'axios'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const CHAT_ID = 'ff71490cf4b211efae140242ac130006'
const showSidebar = ref(false)
const sessions = ref([])
const currentSession = ref(null)
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messageList = ref(null)
const currentAnswer = ref(null)

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
  // 当打开侧边栏时，确保会话列表是最新的
  if (showSidebar.value) {
    getSessionList()
  }
}

// 获取会话列表
const getSessionList = async () => {
  try {
    const res = await http.get(`/api/v1/chats/${CHAT_ID}/sessionsList`, {
      params: {
        page: 1,
        pageSize: 30,
        orderby: 'create_time',
        desc: true
      }
    })

    if (res.data.code === 0) {
      const sessionList = res.data.data.data || []
      sessions.value = sessionList.map(session => {
        // 找到最后一条非系统消息作为会话标题
        let title = '新会话'
        if (session.messages && session.messages.length > 0) {
          const userMessages = session.messages.filter(msg => msg.role === 'user')
          if (userMessages.length > 0) {
            title = userMessages[0].content
          }
        }
        
        return {
          id: session.id,
          title: title,
          createTime: session.create_time,
          messages: session.messages || []
        }
      })

      // 如果有会话，自动选择第一个
      if (sessions.value.length > 0) {
        const firstSession = sessions.value[0]
        currentSession.value = firstSession.id
        currentSessionTitle.value = firstSession.title
        messages.value = firstSession.messages || []
        await scrollToBottom()
      }
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
    showToast('获取会话列表失败')
  }
}

// 切换会话
const switchSession = async (session) => {
  if (currentSession.value === session.id) return  // 如果是当前会话则不切换
  
  currentSession.value = session.id
  currentSessionTitle.value = session.title
  messages.value = session.messages || []  // 直接使用会话中的消息
  await scrollToBottom()
}

// 格式化会话标题
const formatSessionTitle = (session) => {
  if (session.title && session.title !== '新会话') {
    return session.title
  }
  return `会话 ${new Date(session.createTime).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })}`
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  
  // 如果没有当前会话，先创建一个
  if (!currentSession.value) {
    await createNewSession()
    if (!currentSession.value) return
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
      // 保存完整的响应到 currentAnswer
      currentAnswer.value = res.data
      
      // 添加消息到对话列表
      messages.value.push({
        role: 'assistant',
        content: res.data.data.data.answer || '抱歉，我没有找到合适的答案'
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

// 修改 onMounted
onMounted(async () => {
  await getSessionList()  // 进入页面时获取会话列表
})

// 修改 createNewSession，创建完新会话后更新列表
const createNewSession = async () => {
  try {
    const res = await http.post(`/api/v1/chats/${CHAT_ID}/sessions`)
    if (res.data.code === 0) {
      const sessionData = res.data.data.data
      const newSession = {
        id: sessionData.id,
        title: sessionData.name,
        createTime: sessionData.create_time
      }
      sessions.value.unshift(newSession)  // 添加到列表开头
      currentSession.value = newSession.id
      currentSessionTitle.value = newSession.title
      
      // 添加系统的欢迎消息
      if (sessionData.messages && sessionData.messages.length > 0) {
        messages.value = sessionData.messages
      } else {
        messages.value = []
      }
      
      await scrollToBottom()
    } else {
      showToast('创建会话失败')
    }
  } catch (error) {
    console.error('创建会话失败:', error)
    showToast('创建会话失败')
  }
}

// 确认删除对话框
const confirmDelete = (session) => {
  showDialog({
    title: '删除会话',
    message: '确定要删除这个会话吗？',
    showCancelButton: true,
  }).then(() => {
    deleteSession(session)
  }).catch(() => {
    // 取消删除
  })
}

// 删除会话
const deleteSession = async (session) => {
  try {
    const res = await http.delete(`/api/v1/chats/${CHAT_ID}/sessionsDel`, {
      data: {
        ids: [session.id]
      }
    })
    
    if (res.data.code === 0) {
      // 从列表中移除
      sessions.value = sessions.value.filter(s => s.id !== session.id)
      showToast('删除成功')
      
      // 如果删除的是当前会话，切换到其他会话或清空
      if (currentSession.value === session.id) {
        if (sessions.value.length > 0) {
          await switchSession(sessions.value[0])
        } else {
          currentSession.value = null
          currentSessionTitle.value = '健康助手'
          messages.value = []
        }
      }
    } else {
      showToast('删除失败')
    }
  } catch (error) {
    console.error('删除会话失败:', error)
    showToast('删除失败')
  }
}

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (error) {
        console.warn('代码高亮失败:', error)
        return str
      }
    }
    return str
  }
})

// 渲染 Markdown 的函数
const renderMarkdown = (content) => {
  return content ? md.render(content) : ''
}
</script>

<style scoped>
.assistant-page {
  height: calc(100vh - 50px);  /* 减去底部 TabBar 的高度 */
  display: flex;
  background-color: #f7f8fa;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 99; /* 低于侧边栏的 z-index */
}

.sidebar {
  width: 250px;
  background-color: #fff;
  border-right: 1px solid #ebedf0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: fixed;  /* 改为 fixed 定位 */
  left: 0;
  top: 0;
  height: 100%;
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transform: translateX(-100%);
}

.sidebar-hidden {
  transform: translateX(-100%);
}

.sidebar:not(.sidebar-hidden) {
  transform: translateX(0);
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
  margin-left: 0;  /* 移除默认的左边距 */
  transition: margin-left 0.3s;
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
  transition: transform 0.3s;
}

.menu-icon-active {
  transform: rotate(90deg);
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
    position: fixed;
    height: 100%;
  }

  .sidebar-overlay {
    z-index: 999; /* 在移动端提高遮罩层层级 */
  }

  .sidebar {
    z-index: 1000;
  }

  .chat-main {
    padding-bottom: env(safe-area-inset-bottom);  /* 适配 iPhone 底部安全区域 */
  }
}

.session-list .van-cell {
  padding: 12px 16px;
}

.session-list .van-cell.active {
  background-color: #e8f3ff;
}

.session-list .van-cell__title {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-icon {
  font-size: 18px;
  color: #999;
  padding: 8px;
  margin-right: -8px;
  transition: color 0.3s;
}

.delete-icon:hover {
  color: #ff4444;
}

/* 确保删除图标在活跃状态下也可见 */
.session-list .van-cell.active .delete-icon {
  color: #666;
}

.session-list .van-cell.active .delete-icon:hover {
  color: #ff4444;
}

/* 优化移动端点击区域 */
@media (max-width: 768px) {
  .delete-icon {
    padding: 12px;
    margin-right: -12px;
  }
}

/* Markdown 样式 */
.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(p) {
  margin: 0;  /* 移除段落边距 */
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
}

.markdown-content :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.markdown-content :deep(pre) {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 8px 0;
}

.markdown-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #ddd;
  margin: 8px 0;
  padding-left: 12px;
  color: #666;
}

/* 确保用户消息中的文本颜色保持白色 */
.user-message .markdown-content {
  color: #fff;
}

.user-message .markdown-content :deep(code),
.user-message .markdown-content :deep(pre) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.user-message .markdown-content :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .markdown-content {
    color: #e5e5e5;
  }

  .markdown-content :deep(strong) {
    color: #fff;
  }

  .markdown-content :deep(code) {
    background: #2d2d2d;
    color: #d4d4d4;
  }

  .markdown-content :deep(blockquote) {
    color: #aaa;
  }
}
</style> 