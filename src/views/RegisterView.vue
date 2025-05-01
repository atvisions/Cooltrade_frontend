<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="router.push('/')" class="mr-2">
            <i class="ri-arrow-left-line ri-lg"></i>
          </button>
          <h1 class="text-lg font-semibold">注册</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16">
      <div class="max-w-[375px] mx-auto px-4">
        <h1 class="text-2xl font-bold text-center mb-8">注册</h1>
        
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">邮箱</label>
            <input
              type="email"
              v-model="formData.email"
              @input="handleEmailChange"
              required
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="请输入邮箱"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">密码</label>
            <input
              type="password"
              v-model="formData.password"
              @input="handlePasswordChange"
              required
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="请输入密码"
            />
          </div>

          <div class="flex gap-2">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-400 mb-1">验证码</label>
              <input
                type="text"
                v-model="formData.code"
                @input="handleCodeChange"
                required
                class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="请输入验证码"
              />
            </div>
            <button
              type="button"
              @click="handleSendCode"
              :disabled="isSendingCode || countdown > 0"
              class="mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ countdown > 0 ? `${countdown}s后重试` : (isSendingCode ? '发送中...' : '获取验证码') }}
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">邀请码</label>
            <input
              type="text"
              v-model="formData.invitation_code"
              required
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              placeholder="请输入邀请码"
            />
          </div>
          
          <button
            type="submit"
            class="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
            :disabled="loading"
          >
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>
        
        <div class="mt-6 text-center">
          <router-link to="/login" class="text-primary hover:underline">
            已有账号？立即登录
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/api'

const router = useRouter()
const formData = ref({
  email: '',
  password: '',
  code: '',
  invitation_code: ''
})
const loading = ref(false)
const isSendingCode = ref(false)
const countdown = ref(0)

// 保存表单数据到 localStorage
const saveFormData = () => {
  localStorage.setItem('registerFormData', JSON.stringify({
    email: formData.value.email,
    password: formData.value.password,
    code: formData.value.code
  }))
}

// 从 localStorage 恢复表单数据
const restoreFormData = () => {
  const savedData = localStorage.getItem('registerFormData')
  if (savedData) {
    const { email, password, code } = JSON.parse(savedData)
    formData.value.email = email
    formData.value.password = password
    formData.value.code = code
  }
}

// 监听邮箱和密码的变化
const handleEmailChange = () => {
  saveFormData()
}

const handlePasswordChange = () => {
  saveFormData()
}

const handleCodeChange = () => {
  saveFormData()
}

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const handleSendCode = async () => {
  if (!formData.value.email) {
    alert('请输入邮箱')
    return
  }

  isSendingCode.value = true
  try {
    await auth.sendCode({ email: formData.value.email })
    startCountdown()
  } catch (error) {
    console.error('发送验证码失败:', error)
    alert('发送验证码失败')
  } finally {
    isSendingCode.value = false
  }
}

const handleRegister = async () => {
  if (!formData.value.email || !formData.value.password || !formData.value.code || !formData.value.invitation_code) {
    alert('请填写所有必填字段')
    return
  }

  loading.value = true
  try {
    const requestData = {
      email: formData.value.email.trim(),
      password: formData.value.password.trim(),
      code: formData.value.code.trim(),
      invitation_code: formData.value.invitation_code.trim()
    }
    console.log('Sending registration request with data:', requestData)
    
    const response = await auth.register(requestData)
    console.log('Registration response:', response)
    
    // 注册成功后清除保存的表单数据
    localStorage.removeItem('registerFormData')
    // 直接跳转到登录页面
    router.push('/login')
  } catch (error: any) {
    console.error('Registration failed:', error)
    if (error.response?.data?.message?.code) {
      // 显示验证码错误
      alert(`验证码错误: ${error.response.data.message.code[0]}`)
    } else if (error.response?.data?.message) {
      // 显示其他错误信息
      const errorMessages = Object.entries(error.response.data.message)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
        .join('\n')
      alert(errorMessages)
    } else {
      alert('注册失败，请检查输入信息')
    }
  } finally {
    loading.value = false
  }
}

// 组件挂载时恢复表单数据
onMounted(() => {
  restoreFormData()
})
</script> 