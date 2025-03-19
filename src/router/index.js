import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('../views/Report.vue'),
    meta: { requiresAuth: true }  // 需要登录才能访问
  },
  {
    path: '/assistant',
    name: 'Assistant',
    component: () => import('../views/Assistant.vue')
  },
  {
    path: '/plan',
    name: 'Plan',
    component: () => import('../views/Plan.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue')
  },
  {
    path: '/payment',
    name: 'Payment',
    component: () => import('../views/Payment.vue')
  },
  {
    path: '/payment/:groupId',
    name: 'PaymentWithGroup',
    component: () => import('@/views/Payment.vue'),
    meta: { requiresAuth: true }  // 添加登录验证
  },
  {
    path: '/api/auth/wechat/callback',
    name: 'WxCallback',
    component: () => import('../views/WxCallback.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    // 需要登录但没有token，跳转到登录页
    // 如果是支付页面，保存群组ID
    if (to.name === 'PaymentWithGroup') {
      const groupId = to.params.groupId
      localStorage.setItem('pendingPaymentGroupId', groupId)
      // 保存来源页面路径
      localStorage.setItem('loginRedirectPath', to.fullPath)
      next('/login')
    } else {
      // 保存来源页面路径
      localStorage.setItem('loginRedirectPath', to.fullPath)
      next('/login')
    }
  } else if (to.path === '/login' && token) {
    // 已登录状态下访问登录页
    // 检查是否有待处理的支付
    const pendingGroupId = localStorage.getItem('pendingPaymentGroupId')
    if (pendingGroupId) {
      localStorage.removeItem('pendingPaymentGroupId')
      next(`/payment/${pendingGroupId}`)
    } else {
      // 检查是否有保存的重定向路径
      const redirectPath = localStorage.getItem('loginRedirectPath')
      if (redirectPath) {
        localStorage.removeItem('loginRedirectPath')
        next(redirectPath)
      } else {
        next('/report')
      }
    }
  } else {
    next()
  }
})

export default router 