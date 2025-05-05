<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-scroll">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center h-12 px-4">
          <h1 class="text-lg font-semibold">个人中心</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16">
      <div class="max-w-[375px] mx-auto px-4">
        <!-- 未登录状态 -->
        <div v-if="!isLoggedIn" class="bg-gray-800 rounded-lg p-6 mb-6">
          <div class="text-center">
            <div class="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              <i class="ri-user-3-line"></i>
            </div>
            <h2 class="text-lg font-semibold mb-2">未登录</h2>
            <p class="text-gray-400 text-sm mb-4">登录后查看个人中心</p>
            <router-link
              to="/login"
              class="inline-block py-2 px-6 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
            >
              立即登录
            </router-link>
          </div>
        </div>

        <!-- 已登录状态 -->
        <template v-else>
          <!-- 用户信息卡片 -->
          <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <div class="flex items-center space-x-4">
              <!-- 头像 -->
              <div class="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center text-2xl font-bold overflow-hidden">
                {{ userInfo.email?.[0]?.toUpperCase() || 'U' }}
              </div>
              <!-- 用户信息 -->
              <div class="flex-1">
                <h2 class="text-base font-semibold">{{ userInfo.email }}</h2>
                <p class="text-gray-500 text-xs mt-1">注册时间: {{ formatDate(userInfo.created_at) }}</p>
              </div>
            </div>
          </div>

          <!-- 功能列表 -->
          <div class="space-y-4">
            <router-link to="/change-password" class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center">
              <i class="ri-lock-password-line mr-3"></i>
              修改密码
              <i class="ri-arrow-right-s-line ml-auto"></i>
            </router-link>
            <button class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center">
              <i class="ri-settings-3-line mr-3"></i>
              设置
              <i class="ri-arrow-right-s-line ml-auto"></i>
            </button>
            <button class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center">
              <i class="ri-question-line mr-3"></i>
              帮助与反馈
              <i class="ri-arrow-right-s-line ml-auto"></i>
            </button>
            <button class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center">
              <i class="ri-information-line mr-3"></i>
              关于我们
              <i class="ri-arrow-right-s-line ml-auto"></i>
            </button>
            <button
              class="w-full py-3 px-4 bg-red-500 text-white rounded-lg font-medium flex items-center"
              @click="handleLogout"
            >
              <i class="ri-logout-box-line mr-3"></i>
              退出登录
            </button>
          </div>
        </template>
      </div>
    </main>

    <!-- 底部导航栏 -->
    <nav class="fixed bottom-0 w-full bg-[#0F172A]/95 backdrop-blur-md border-t border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="grid grid-cols-2 h-16">
          <router-link to="/" class="flex flex-col items-center justify-center text-gray-500">
            <i class="ri-line-chart-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">行情</span>
          </router-link>
          <router-link to="/profile" class="flex flex-col items-center justify-center text-primary border-t-2 border-primary">
            <i class="ri-user-3-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">我的</span>
          </router-link>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import axios from 'axios'

const router = useRouter()
const userInfo = ref({
  id: 0,
  email: '',
  created_at: '',
  updated_at: ''
})

const isLoggedIn = computed(() => {
  return !!localStorage.getItem('token')
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchUserInfo = async () => {
  if (!isLoggedIn.value) return

  try {
    // 先尝试从本地存储获取用户信息
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      userInfo.value = JSON.parse(savedUserInfo)
    }

    // 然后从服务器获取最新信息
    // 在开发环境中使用代理
    const url = process.env.NODE_ENV !== 'production'
      ? '/api/auth/profile/'
      : `${api.defaults.baseURL}/auth/profile/`;



    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || ''
      }
    });

    const data = response.data;
    if (data?.status === 'success' && data?.data) {
      userInfo.value = data.data;
      // 更新本地存储
      localStorage.setItem('userInfo', JSON.stringify(data.data));
    }
  } catch (error) {
    // 获取用户信息失败，使用本地存储的信息
  }
}

const handleLogout = () => {
  // 清除本地存储
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  // 跳转到登录页
  router.push('/login')
}

onMounted(() => {
  fetchUserInfo()
})
</script>