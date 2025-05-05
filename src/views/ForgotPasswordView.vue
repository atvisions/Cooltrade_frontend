<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-auto">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center px-4 py-3">
          <button @click="router.push('/login')" class="mr-2">
            <i class="ri-arrow-left-line ri-lg"></i>
          </button>
          <h1 class="text-lg font-semibold">忘记密码</h1>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="flex-1 pt-16 pb-16">
      <div class="max-w-[375px] mx-auto px-4">
  
        <!-- 一般性错误提示 -->
        <div v-if="generalError" class="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
          {{ generalError }}
        </div>

        <form @submit.prevent="handleResetPassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">邮箱</label>
            <input
              type="email"
              v-model="formData.email"
              @input="handleEmailChange"
              required
              ref="emailInput"
              :class="[
                'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none',
                errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-primary focus:ring-primary'
              ]"
              placeholder="请输入邮箱"
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-500">{{ errors.email }}</p>
           </div>

          <div class="flex gap-2">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-400 mb-1">验证码</label>
              <input
                type="text"
                v-model="formData.code"
                @input="handleCodeChange"
                required
                ref="codeInput"
                :class="[
                  'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none',
                  errors.code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-primary focus:ring-primary'
                ]"
                placeholder="请输入验证码"
              />
              <p v-if="errors.code" class="mt-1 text-sm text-red-500">{{ errors.code }}</p>
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
            <label class="block text-sm font-medium text-gray-400 mb-1">新密码</label>
            <input
              type="password"
              v-model="formData.new_password"
              @input="handlePasswordChange"
              required
              ref="passwordInput"
              :class="[
                'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none',
                errors.new_password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-primary focus:ring-primary'
              ]"
              placeholder="请输入新密码"
            />
            <p v-if="errors.new_password" class="mt-1 text-sm text-red-500">{{ errors.new_password }}</p>
            <p class="mt-1 text-xs text-gray-500">密码至少6位，包含字母和数字</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1">确认密码</label>
            <input
              type="password"
              v-model="formData.confirm_password"
              @input="handleConfirmPasswordChange"
              required
              ref="confirmPasswordInput"
              :class="[
                'w-full px-4 py-2 rounded-lg bg-gray-800 border focus:ring-1 outline-none',
                errors.confirm_password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-primary focus:ring-primary'
              ]"
              placeholder="请再次输入新密码"
            />
            <p v-if="errors.confirm_password" class="mt-1 text-sm text-red-500">{{ errors.confirm_password }}</p>
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
            :disabled="loading"
          >
            {{ loading ? '重置中...' : '重置密码' }}
          </button>
        </form>

        <!-- 重置成功弹窗 -->
        <div v-if="showSuccessModal" class="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
          <div class="bg-gray-900 rounded-lg p-6 max-w-xs w-full mx-4">
            <div class="mb-4 flex justify-center">
              <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <i class="ri-check-line ri-2x text-green-500"></i>
              </div>
            </div>
            <h2 class="text-xl font-semibold mb-2 text-center">密码重置成功</h2>
            <p class="text-gray-400 mb-6 text-center">您的密码已成功重置，请使用新密码登录。</p>
            <button
              @click="handleSuccessModalClose"
              class="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
            >
              返回登录
            </button>
          </div>
        </div>

        <div class="mt-6 text-center">
          <router-link to="/login" class="text-primary hover:underline">
            返回登录
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
const loading = ref(false)
const isSendingCode = ref(false)
const countdown = ref(0)
const showSuccessModal = ref(false)

// 添加错误提示相关状态
const errors = ref({
  email: '',
  code: '',
  new_password: '',
  confirm_password: ''
})
const generalError = ref('')

// 添加输入框的引用，方便定位错误
const emailInput = ref<HTMLInputElement | null>(null)
const codeInput = ref<HTMLInputElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)
const confirmPasswordInput = ref<HTMLInputElement | null>(null)

const formData = ref({
  email: '',
  code: '',
  new_password: '',
  confirm_password: ''
})

// 清除错误信息
const clearErrors = () => {
  errors.value = {
    email: '',
    code: '',
    new_password: '',
    confirm_password: ''
  }
  generalError.value = ''
}

// 对错误字段进行聚焦
const focusErrorField = (field: 'email' | 'code' | 'new_password' | 'confirm_password') => {
  const inputRefs = {
    email: emailInput,
    code: codeInput,
    new_password: passwordInput,
    confirm_password: confirmPasswordInput
  }

  const targetInput = inputRefs[field]
  if (targetInput.value) {
    setTimeout(() => {
      targetInput.value?.focus()
    }, 100)
  }
}

// 保存表单数据到 localStorage
const saveFormData = () => {
  localStorage.setItem('resetPasswordFormData', JSON.stringify({
    email: formData.value.email,
    code: formData.value.code
  }))
}

// 从 localStorage 恢复表单数据
const restoreFormData = () => {
  const savedData = localStorage.getItem('resetPasswordFormData')
  if (savedData) {
    try {
      const { email, code } = JSON.parse(savedData)
      formData.value.email = email || ''
      formData.value.code = code || ''
    } catch (e) {
      console.error('恢复表单数据失败:', e)
    }
  }
}

// 监听输入变化时清除对应字段的错误提示
const handleEmailChange = () => {
  errors.value.email = ''
  generalError.value = ''
  saveFormData()
}

const handleCodeChange = () => {
  errors.value.code = ''
  generalError.value = ''
  saveFormData()
}

const handlePasswordChange = () => {
  errors.value.new_password = ''
  generalError.value = ''
}

const handleConfirmPasswordChange = () => {
  errors.value.confirm_password = ''
  generalError.value = ''
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
  clearErrors()

  if (!formData.value.email) {
    errors.value.email = '请输入邮箱'
    focusErrorField('email')
    return
  }

  isSendingCode.value = true
  try {
    console.log('发送验证码请求:', formData.value.email)
    const response = await auth.requestPasswordReset({
      email: formData.value.email.trim()
    })

    console.log('验证码请求响应:', response)

    if (response.status === 'success') {
      startCountdown()
      generalError.value = ''
    } else {
      generalError.value = response.message || '发送验证码失败，请稍后重试'
    }
  } catch (error: any) {
    console.error('发送验证码失败:', error)

    // 详细记录错误信息
    if (error.response) {
      console.error('错误响应详情:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      })

      // 显示服务器返回的详细错误信息
      console.log('服务器错误详情:', JSON.stringify(error.response.data, null, 2))

      // 如果服务器返回了错误消息，直接显示给用户
      if (error.response.data && typeof error.response.data === 'object') {
        if (error.response.data.message) {
          generalError.value = typeof error.response.data.message === 'string'
            ? error.response.data.message
            : JSON.stringify(error.response.data.message)
        } else if (error.response.data.detail) {
          generalError.value = typeof error.response.data.detail === 'string'
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        } else {
          generalError.value = '服务器邮件发送功能超时，请联系管理员或稍后再试'
        }
      } else {
        generalError.value = '服务器邮件发送功能超时，请联系管理员或稍后再试'
      }
    }

    // 这部分代码已经被上面的错误处理逻辑替代，可以删除
    if (error.response?.status === 404) {
      errors.value.email = '该邮箱未注册'
      focusErrorField('email')
    } else if (error.code === 'ECONNABORTED') {
      generalError.value = '网络连接超时，请检查网络'
    }
  } finally {
    isSendingCode.value = false
  }
}

const handleResetPassword = async () => {
  clearErrors()

  // 表单验证
  let hasError = false

  if (!formData.value.email) {
    errors.value.email = '请输入邮箱'
    if (!hasError) {
      focusErrorField('email')
      hasError = true
    }
  }

  if (!formData.value.code) {
    errors.value.code = '请输入验证码'
    if (!hasError) {
      focusErrorField('code')
      hasError = true
    }
  }

  if (!formData.value.new_password) {
    errors.value.new_password = '请输入新密码'
    if (!hasError) {
      focusErrorField('new_password')
      hasError = true
    }
  } else {
    // 检查密码是否包含字母和数字
    const hasLetter = /[A-Za-z]/.test(formData.value.new_password)
    const hasNumber = /[0-9]/.test(formData.value.new_password)
    if (formData.value.new_password.length < 6) {
      errors.value.new_password = '密码长度至少为6位'
      if (!hasError) {
        focusErrorField('new_password')
        hasError = true
      }
    } else if (!hasLetter || !hasNumber) {
      errors.value.new_password = '密码必须包含字母和数字'
      if (!hasError) {
        focusErrorField('new_password')
        hasError = true
      }
    }
  }

  if (!formData.value.confirm_password) {
    errors.value.confirm_password = '请确认密码'
    if (!hasError) {
      focusErrorField('confirm_password')
      hasError = true
    }
  } else if (formData.value.new_password !== formData.value.confirm_password) {
    errors.value.confirm_password = '两次输入的密码不一致'
    if (!hasError) {
      focusErrorField('confirm_password')
      hasError = true
    }
  }

  if (hasError) return

  loading.value = true
  try {
    console.log('重置密码请求:', {
      email: formData.value.email,
      code: formData.value.code,
      new_password: '******',
      confirm_password: '******'
    })

    const response = await auth.resetPasswordWithCode({
      email: formData.value.email.trim(),
      code: formData.value.code.trim(),
      new_password: formData.value.new_password.trim(),
      confirm_password: formData.value.confirm_password.trim()
    })

    console.log('重置密码响应:', response)

    if (response.status === 'success') {
      // 清除保存的表单数据
      localStorage.removeItem('resetPasswordFormData')
      // 显示成功弹窗
      showSuccessModal.value = true
    } else {
      generalError.value = response.message || '重置密码失败，请稍后重试'
    }
  } catch (error: any) {
    console.error('重置密码失败:', error)

    // 详细记录错误信息
    if (error.response) {
      console.error('错误响应详情:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      })

      // 显示服务器返回的详细错误信息
      console.log('服务器错误详情:', JSON.stringify(error.response.data, null, 2))

      // 如果服务器返回了错误消息，直接显示给用户
      if (error.response.data && typeof error.response.data === 'object') {
        if (error.response.data.message) {
          generalError.value = typeof error.response.data.message === 'string'
            ? error.response.data.message
            : JSON.stringify(error.response.data.message)
        } else if (error.response.data.detail) {
          generalError.value = typeof error.response.data.detail === 'string'
            ? error.response.data.detail
            : JSON.stringify(error.response.data.detail)
        } else {
          generalError.value = '服务器邮件发送功能超时，请联系管理员或稍后再试'
        }
      } else {
        generalError.value = '服务器邮件发送功能超时，请联系管理员或稍后再试'
      }
    }

    // 处理特定的错误情况
    if (error.response?.status === 400) {
      // 如果是验证码相关的错误，特别处理
      if (error.response.data?.message?.code) {
        errors.value.code = Array.isArray(error.response.data.message.code)
          ? error.response.data.message.code[0]
          : error.response.data.message.code
        focusErrorField('code')
      } else {
        errors.value.code = '验证码无效或已过期'
        focusErrorField('code')
      }
    } else if (error.code === 'ECONNABORTED') {
      generalError.value = '网络连接超时，请检查网络'
    }
  } finally {
    loading.value = false
  }
}

const handleSuccessModalClose = () => {
  showSuccessModal.value = false
  router.push('/login')
}

// 组件挂载时恢复表单数据
onMounted(() => {
  restoreFormData()
})
</script>
