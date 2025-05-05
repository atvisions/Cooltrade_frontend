<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="router.push('/profile')" class="mr-2">
            <i class="ri-arrow-left-line ri-lg"></i>
          </button>
          <h1 class="text-lg font-semibold">修改密码</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16">
      <div class="max-w-[375px] mx-auto px-4">
        <div v-if="!isLoggedIn" class="text-center py-8">
          <p class="text-gray-400 mb-4">请先登录后再修改密码</p>
          <router-link
            to="/login?redirect=/change-password"
            class="inline-block py-2 px-6 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
          >
            去登录
          </router-link>
        </div>

        <div v-else>
          <p class="text-gray-400 mb-6">请输入当前密码和新密码</p>
          
          <form @submit.prevent="handleChangePassword" class="space-y-6">
            <div v-if="error" class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {{ error }}
            </div>
            
            <div v-if="success" class="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {{ success }}
            </div>
            
            <div>
              <label for="current_password" class="block text-sm font-medium text-gray-300 mb-1">当前密码</label>
              <input
                id="current_password"
                v-model="formData.current_password"
                type="password"
                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                required
              >
            </div>
            
            <div>
              <label for="new_password" class="block text-sm font-medium text-gray-300 mb-1">新密码</label>
              <input
                id="new_password"
                v-model="formData.new_password"
                type="password"
                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                required
              >
              <p class="mt-1 text-xs text-gray-500">密码至少6位，包含字母和数字</p>
            </div>
            
            <div>
              <label for="confirm_password" class="block text-sm font-medium text-gray-300 mb-1">确认新密码</label>
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
              {{ loading ? '提交中...' : '修改密码' }}
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
import { auth } from '@/api'

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
    error.value = '请填写所有必填字段'
    return
  }
  
  if (formData.value.new_password !== formData.value.confirm_password) {
    error.value = '两次输入的新密码不一致'
    return
  }
  
  if (formData.value.new_password.length < 6) {
    error.value = '密码长度至少为6位'
    return
  }
  
  // 检查密码是否包含字母和数字
  const hasLetter = /[A-Za-z]/.test(formData.value.new_password)
  const hasNumber = /[0-9]/.test(formData.value.new_password)
  if (!hasLetter || !hasNumber) {
    error.value = '密码必须包含字母和数字'
    return
  }

  loading.value = true
  try {
    const response = await auth.changePassword({
      current_password: formData.value.current_password,
      new_password: formData.value.new_password,
      confirm_password: formData.value.confirm_password
    })
    
    if (response.status === 'success') {
      success.value = '密码修改成功'
      
      // 如果返回了新的token，更新本地存储
      if (response.data?.token) {
        localStorage.setItem('token', `Token ${response.data.token}`)
      }
      
      // 清空表单
      formData.value = {
        current_password: '',
        new_password: '',
        confirm_password: ''
      }
      
      // 3秒后返回个人中心
      setTimeout(() => {
        router.push('/profile')
      }, 3000)
    } else {
      error.value = response.message || '修改密码失败，请稍后重试'
    }
  } catch (err: any) {
    console.error('修改密码失败:', err)
    
    // 详细记录错误信息
    if (err.response) {
      // 显示服务器返回的详细错误信息
      if (err.response.data && typeof err.response.data === 'object') {
        if (err.response.data.message) {
          error.value = typeof err.response.data.message === 'string' 
            ? err.response.data.message 
            : JSON.stringify(err.response.data.message)
        } else if (err.response.data.detail) {
          error.value = typeof err.response.data.detail === 'string'
            ? err.response.data.detail
            : JSON.stringify(err.response.data.detail)
        } else {
          error.value = '修改密码失败，请稍后重试'
        }
      } else {
        error.value = '修改密码失败，请稍后重试'
      }
    } else if (err.code === 'ECONNABORTED') {
      error.value = '网络连接超时，请检查网络'
    } else {
      error.value = '修改密码失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>
