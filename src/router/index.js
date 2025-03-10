import { createRouter, createWebHistory } from 'vue-router'
import Report from '../views/Report.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/',
    redirect: '/report'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/report',
    name: 'Report',
    component: Report,
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
    // 需要登录但没有 token，跳转到登录页
    next('/login')
  } else if (to.path === '/login' && token) {
    // 已登录状态下访问登录页，跳转到首页
    next('/report')
  } else {
    next()
  }
})

export default router 