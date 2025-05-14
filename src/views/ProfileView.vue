<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-scroll">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center h-12 px-4">
          <h1 class="text-lg font-semibold">{{ t('profile.profile') }}</h1>
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
            <h2 class="text-lg font-semibold mb-2">{{ t('auth.logout') }}</h2>
            <p class="text-gray-400 text-sm mb-4">{{ t('profile.profile') }}</p>
            <router-link
              to="/login"
              class="inline-block py-2 px-6 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-medium"
            >
              {{ t('auth.login') }}
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
              {{ t('auth.change_password') }}
              <i class="ri-arrow-right-s-line ml-auto"></i>
            </router-link>

            <!-- 语言设置 - 与其他设置保持一致的样式 -->
            <div
              class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center cursor-pointer"
              @click="showLanguageModal = true"
            >
              <i class="ri-global-line mr-3"></i>
              {{ t('profile.language_settings') }}
              <div class="ml-auto flex items-center">
                <span class="text-gray-400 mr-2">{{ getCurrentLanguageName() }}</span>
                <i class="ri-arrow-right-s-line"></i>
              </div>
            </div>

            <!-- 语言选择模态框 -->
            <div v-if="showLanguageModal" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
              <div class="bg-gray-900 rounded-lg w-full max-w-sm overflow-hidden">
                <div class="p-4 border-b border-gray-800 flex justify-between items-center">
                  <h3 class="text-lg font-medium">{{ t('profile.language_settings') }}</h3>
                  <button @click="showLanguageModal = false" class="text-gray-400 hover:text-white">
                    <i class="ri-close-line text-xl"></i>
                  </button>
                </div>
                <div class="p-4">
                  <div class="space-y-2">
                    <button
                      v-for="lang in languages"
                      :key="lang.code"
                      @click="selectLanguage(lang.code)"
                      class="w-full py-3 px-4 rounded-lg flex items-center justify-between"
                      :class="currentLanguage === lang.code ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-white hover:bg-gray-700'"
                    >
                      <div class="flex items-center">
                        <span class="text-lg mr-3">{{ getLangFlag(lang.code) }}</span>
                        <span>{{ lang.name }}</span>
                      </div>
                      <i v-if="currentLanguage === lang.code" class="ri-check-line text-primary"></i>
                    </button>
                  </div>
                </div>
                <div class="p-4 border-t border-gray-800 flex justify-end">
                  <button
                    @click="showLanguageModal = false"
                    class="py-2 px-4 bg-primary text-white rounded-lg"
                  >
                    {{ t('common.confirm') }}
                  </button>
                </div>
              </div>
            </div>

            <a
              href="https://www.kxianjunshi.com/privacy-policy/"
              target="_blank"
              class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center"
            >
              <i class="ri-shield-check-line mr-3"></i>
              {{ t('common.privacy_policy') }}
              <i class="ri-external-link-line ml-auto"></i>
            </a>
            <button class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center">
              <i class="ri-information-line mr-3"></i>
              {{ t('common.about_us') }}
              <i class="ri-arrow-right-s-line ml-auto"></i>
            </button>
            <button
              class="w-full py-3 px-4 bg-red-500 text-white rounded-lg font-medium flex items-center"
              @click="handleLogout"
            >
              <i class="ri-logout-box-line mr-3"></i>
              {{ t('auth.logout') }}
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
            <span class="text-xs mt-0.5">{{ t('analysis.market_data') }}</span>
          </router-link>
          <router-link to="/profile" class="flex flex-col items-center justify-center text-primary border-t-2 border-primary">
            <i class="ri-user-3-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5">{{ t('profile.profile') }}</span>
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
import { setLanguage } from '@/i18n'
import { useEnhancedI18n } from '@/utils/i18n-helper'

const router = useRouter()
const { t, locale } = useEnhancedI18n()

const userInfo = ref({
  id: 0,
  email: '',
  created_at: '',
  updated_at: '',
  language: 'zh-CN'
})

// 控制语言选择模态框的显示
const showLanguageModal = ref(false)

// 当前语言
const currentLanguage = computed(() => {
  return locale.value
})

// 获取当前语言的名称
const getCurrentLanguageName = (): string => {
  const lang = languages.find(l => l.code === currentLanguage.value)
  return lang ? lang.name : 'Unknown'
}

// 支持的语言列表
const languages = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'en-US', name: 'English' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' }
]

// 获取语言对应的国旗表情
const getLangFlag = (langCode: string): string => {
  const flagMap: Record<string, string> = {
    'zh-CN': '🇨🇳',
    'en-US': '🇺🇸',
    'ja-JP': '🇯🇵',
    'ko-KR': '🇰🇷'
  }
  return flagMap[langCode] || '🌐'
}

// 选择语言并关闭模态框
const selectLanguage = (lang: string) => {
  setLanguage(lang)

  // 如果用户已登录，更新用户信息
  if (isLoggedIn.value) {
    updateUserLanguage(lang)
  }

  // 关闭模态框
  showLanguageModal.value = false
}

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

// 更新用户语言设置
const updateUserLanguage = async (lang: string) => {
  try {
    const url = process.env.NODE_ENV !== 'production'
      ? '/api/auth/profile/'
      : `${api.defaults.baseURL}/auth/profile/`;

    await axios.put(url,
      { language: lang },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || ''
        }
      }
    );

    // 更新本地用户信息
    userInfo.value.language = lang;
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value));
  } catch (error) {
    console.error('更新用户语言设置失败:', error);
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

  // 如果用户已登录，使用用户的语言设置
  if (isLoggedIn.value && userInfo.value.language) {
    setLanguage(userInfo.value.language)
  }
})
</script>