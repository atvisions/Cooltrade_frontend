<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="router.push('/')" class="mr-2">
            <i class="ri-arrow-left-line ri-lg"></i>
          </button>
          <h1 class="text-lg font-semibold">登录</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16">
      <div class="max-w-[375px] mx-auto px-4">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="error" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {{ error }}
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-1">邮箱</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            >
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-1">密码</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            >
          </div>
          
          <button
            type="submit"
            class="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
            :disabled="loading"
          >
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-400">
            还没有账号？
            <router-link to="/register" class="text-primary hover:underline">立即注册</router-link>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { auth } from '@/api'

const router = useRouter()
const route = useRoute()
const formData = ref({
  email: '',
  password: ''
})
const loading = ref(false)
const error = ref<string | null>(null)

const handleLogin = async () => {
  error.value = null
  
  if (!formData.value.email || !formData.value.password) {
    error.value = '请填写所有必填字段'
    return
  }

  loading.value = true
  try {
    const response = await auth.login({
      email: formData.value.email.trim(),
      password: formData.value.password.trim()
    })
    
    // 保存 token
    if (response.status === 'success' && response.data?.token) {
      // 添加Token前缀
      localStorage.setItem('token', `Token ${response.data.token}`)
      // 保存用户信息
      localStorage.setItem('userInfo', JSON.stringify(response.data.user))
      // 跳转到重定向页面或首页
      const redirectPath = route.query.redirect as string || '/'
      router.push(redirectPath)
    } else {
      error.value = '登录失败：未获取到 token'
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    if (error.response?.data?.message) {
      error.value = error.response.data.message
    } else if (error.response?.status === 401) {
      error.value = '邮箱或密码错误'
    } else if (error.response?.status === 429) {
      error.value = '登录尝试次数过多，请稍后再试'
    } else if (error.code === 'ECONNABORTED') {
      error.value = '网络连接超时，请检查网络'
    } else {
      error.value = '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script> 