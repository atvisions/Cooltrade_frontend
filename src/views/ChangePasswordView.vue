<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="router.push('/profile')" class="mr-2">
            <i class="ri-arrow-left-line ri-lg"></i>
          </button>
          <h1 class="text-lg font-semibold">{{ t('auth.change_password') }}</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16">
      <div class="max-w-[375px] mx-auto px-4">
        <div v-if="!isLoggedIn" class="text-center py-8">
          <p class="text-gray-400 mb-4">{{ t('auth.login_required_for_password_change') }}</p>
          <router-link
            to="/login?redirect=/change-password"
            class="inline-block py-2 px-6 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
          >
            {{ t('auth.go_to_login') }}
          </router-link>
        </div>

        <div v-else>
          <p class="text-gray-400 mb-6">{{ t('auth.enter_current_and_new_password') }}</p>

          <form @submit.prevent="handleChangePassword" class="space-y-6">
            <div v-if="error" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {{ error }}
            </div>

            <div v-if="success" class="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {{ success }}
            </div>

            <div>
              <label for="current_password" class="block text-sm font-medium text-gray-300 mb-1">{{ t('auth.current_password') }}</label>
              <input
                id="current_password"
                v-model="formData.current_password"
                type="password"
                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                required
              >
            </div>

            <div>
              <label for="new_password" class="block text-sm font-medium text-gray-300 mb-1">{{ t('auth.new_password') }}</label>
              <input
                id="new_password"
                v-model="formData.new_password"
                type="password"
                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                required
              >
              <p class="mt-1 text-xs text-gray-500">{{ t('auth.password_requirements') }}</p>
            </div>

            <div>
              <label for="confirm_password" class="block text-sm font-medium text-gray-300 mb-1">{{ t('auth.confirm_new_password') }}</label>
              <input
                id="confirm_password"
                v-model="formData.confirm_password"
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
              {{ loading ? t('common.submitting') : t('auth.change_password') }}
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { auth } from '@/api'
import { useEnhancedI18n } from '@/utils/i18n-helper'

const { t } = useEnhancedI18n()

const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const formData = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const isLoggedIn = computed(() => {
  return !!localStorage.getItem('token')
})

const handleChangePassword = async () => {
  error.value = null
  success.value = null

  // 表单验证
  if (!formData.value.current_password || !formData.value.new_password || !formData.value.confirm_password) {
    error.value = t('errors.fill_all_fields')
    return
  }

  if (formData.value.new_password !== formData.value.confirm_password) {
    error.value = t('errors.passwords_not_match')
    return
  }

  if (formData.value.new_password.length < 6) {
    error.value = t('errors.password_too_short')
    return
  }

  // 检查密码是否包含字母和数字
  const hasLetter = /[A-Za-z]/.test(formData.value.new_password)
  const hasNumber = /[0-9]/.test(formData.value.new_password)
  if (!hasLetter || !hasNumber) {
    error.value = t('errors.password_must_contain_letters_numbers')
    return
  }

  loading.value = true
  try {
    console.log('发送修改密码请求');

    // 使用 axios 直接发送请求，避免使用 api 实例
    const baseUrl = process.env.NODE_ENV === 'development' ? '/api' : 'https://www.cooltrade.xyz/api';
    const url = `${baseUrl}/auth/change-password/`;

    console.log('修改密码请求URL:', url);

    // 获取认证令牌
    const token = localStorage.getItem('token');
    if (!token) {
      error.value = t('errors.not_logged_in');
      loading.value = false;
      return;
    }

    const response = await axios.post(url, {
      current_password: formData.value.current_password.trim(),
      new_password: formData.value.new_password.trim(),
      confirm_password: formData.value.confirm_password.trim()
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });

    console.log('修改密码响应:', response);

    if (response.data && response.data.status === 'success') {
      success.value = t('auth.password_changed_success');

      // 如果返回了新的token，更新本地存储
      if (response.data.data?.token) {
        localStorage.setItem('token', `Token ${response.data.data.token}`);
      }

      // 清空表单
      formData.value = {
        current_password: '',
        new_password: '',
        confirm_password: ''
      };

      // 3秒后返回个人中心
      setTimeout(() => {
        router.push('/profile');
      }, 3000);
    } else {
      error.value = response.data?.message || t('errors.password_change_failed');
    }
  } catch (err: any) {
    console.error(t('errors.password_change_failed_log'), err);

    // 详细记录错误信息
    if (err.response) {
      // 显示服务器返回的详细错误信息
      console.error('服务器响应:', err.response);
      if (err.response.data && err.response.data.message) {
        error.value = err.response.data.message;
      } else if (err.response.data && err.response.data.errors) {
        // 处理验证错误
        const errorMessages = [];
        for (const field in err.response.data.errors) {
          errorMessages.push(err.response.data.errors[field]);
        }
        error.value = errorMessages.join(', ');
      } else {
        error.value = t('errors.password_change_failed');
      }
    } else if (err.request) {
      // 请求已发送但没有收到响应
      console.error('未收到响应:', err.request);
      error.value = t('errors.no_response_from_server');
    } else {
      // 请求设置时出错
      console.error('请求错误:', err.message);
      error.value = t('errors.password_change_failed');
    }


  } finally {
    loading.value = false
  }
}
</script>
