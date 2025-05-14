<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="router.push('/')" class="mr-2">
            <i class="ri-arrow-left-line ri-lg"></i>
          </button>
          <h1 class="text-lg font-semibold">{{ t('auth.login') }}</h1>
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
            <label for="email" class="block text-sm font-medium text-gray-300 mb-1">{{ t('auth.email') }}</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              required
            >
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label for="password" class="block text-sm font-medium text-gray-300">{{ t('auth.password') }}</label>
              <a href="#" @click.prevent="goToForgotPassword" class="text-xs text-primary hover:underline">{{ t('auth.forgot_password') }}</a>
            </div>
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
            {{ loading ? t('common.loading') : t('auth.login') }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-400">
            {{ t('auth.no_account') }}
            <a href="#" @click.prevent="goToRegister" class="text-primary hover:underline">{{ t('auth.register_now') }}</a>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import * as ExtensionRouter from '@/utils/extension-router'
import { useEnhancedI18n } from '@/utils/i18n-helper'

// 使用增强的 i18n
const { t } = useEnhancedI18n()

// 测试翻译是否正常工作
onMounted(() => {
  try {
    const testTranslation = t('auth.login')
    console.log('Test translation:', testTranslation)
  } catch (e) {
    console.error('Error using i18n:', e)
  }
})

const router = useRouter()
const route = useRoute()

// 路由辅助函数
const goToForgotPassword = () => ExtensionRouter.goToForgotPassword()
const goToRegister = () => ExtensionRouter.goToRegister()
const formData = ref({
  email: '',
  password: ''
})
const loading = ref(false)
const error = ref<string | null>(null)

const handleLogin = async () => {
  error.value = null

  if (!formData.value.email || !formData.value.password) {
    error.value = t('errors.fill_all_fields')
    return
  }

  loading.value = true
  try {
    // 使用相对路径，让 Vite 的代理服务器处理请求
    const url = '/api/auth/login/';
    console.log('Login URL:', url);

    // 准备请求数据
    const requestData = {
      email: formData.value.email.trim(),
      password: formData.value.password.trim()
    };

    console.log('Request data:', requestData);

    // 将对象转换为 JSON 字符串，确保格式与 curl 请求一致
    const jsonData = JSON.stringify(requestData);
    console.log('JSON data:', jsonData);

    const response = await axios.post(url, jsonData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;
    console.log('Login response:', data);

    // 检查响应格式
    if (data.status === 'success' && data.data) {
      // 保存 token
      const token = data.data.token
      const userData = data.data.user

      if (token) {
        // 添加Token前缀
        localStorage.setItem('token', `Token ${token}`)

        // 保存用户信息
        if (userData) {
          localStorage.setItem('userInfo', JSON.stringify(userData))
        }

        // 跳转到重定向页面或首页
        const redirectPath = route.query.redirect as string || '/'
        router.push(redirectPath)
      } else {
        error.value = t('errors.login_failed_no_token')
      }
    } else {
      console.error('登录响应格式错误', data)
      error.value = data.message || t('errors.login_failed_server_error')
    }
  } catch (err: any) {
    console.error('登录失败:', err)

    // 详细记录错误信息
    if (err.response) {
      console.error('错误响应详情:', {
        status: err.response.status,
        data: err.response.data,
        headers: err.response.headers
      })
    }

    if (err.response?.data?.message) {
      if (typeof err.response.data.message === 'object') {
        // 如果错误消息是对象，尝试提取有用的信息
        const messages = Object.values(err.response.data.message).flat();
        if (messages.length > 0) {
          error.value = messages[0] as string;
        } else {
          error.value = t('errors.login_failed_check_input');
        }
      } else {
        error.value = err.response.data.message;
      }
    } else if (err.response?.data?.detail) {
      error.value = err.response.data.detail;
    } else if (err.response?.status === 401) {
      error.value = t('errors.invalid_credentials');
    } else if (err.response?.status === 429) {
      error.value = t('errors.too_many_attempts');
    } else if (err.code === 'ECONNABORTED') {
      error.value = t('errors.network_timeout');
    } else {
      error.value = t('errors.login_failed_try_later');
    }
  } finally {
    loading.value = false
  }
}
</script>