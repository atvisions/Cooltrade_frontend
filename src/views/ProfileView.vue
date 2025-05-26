<template>
  <div class="min-h-screen flex flex-col bg-[#0F172A] overflow-y-scroll">
    <!-- 顶部导航栏 -->
    <header class="fixed top-0 w-full z-10 bg-[#0F172A]/95 backdrop-blur-md border-b border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="flex items-center h-12 px-4">
          <h1 class="text-lg font-semibold" v-text="t('nav.settings')"></h1>
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
                <p class="text-gray-500 text-xs mt-1"><span v-text="t('profile.registration_time')"></span>: {{ formatDate(userInfo.created_at) }}</p>
              </div>
            </div>
          </div>

          <!-- 功能列表 -->
          <div class="space-y-4">
            <router-link to="/change-password" class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center">
              <i class="ri-lock-password-line mr-3"></i>
              <span v-text="t('auth.change_password')"></span>
              <i class="ri-arrow-right-s-line ml-auto"></i>
            </router-link>

            <!-- 语言设置 - 与其他设置保持一致的样式 -->
            <div
              class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center cursor-pointer"
              @click="showLanguageModal = true"
            >
              <i class="ri-global-line mr-3"></i>
              <span v-text="t('profile.language_settings')"></span>
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
                      class="w-full py-3 px-4 rounded-lg flex items-center justify-between transition-colors duration-200"
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
                <!-- 移除确认按钮，用户点击语言选项后直接关闭模态框 -->
              </div>
            </div>

            <a
              href="https://www.cooltrade.xyz/privacy-policy/"
              target="_blank"
              class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center"
            >
              <i class="ri-shield-check-line mr-3"></i>
              <span v-text="t('common.privacy_policy')"></span>
              <i class="ri-external-link-line ml-auto"></i>
            </a>
            <button class="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium flex items-center">
              <i class="ri-information-line mr-3"></i>
              <span v-text="t('common.about_us')"></span>
              <i class="ri-arrow-right-s-line ml-auto"></i>
            </button>
            <button
              class="w-full py-3 px-4 bg-red-500 text-white rounded-lg font-medium flex items-center"
              @click="handleLogout"
            >
              <i class="ri-logout-box-line mr-3"></i>
              <span v-text="t('auth.logout')"></span>
            </button>
          </div>
        </template>
      </div>
    </main>

    <!-- 底部导航栏 -->
    <nav class="fixed bottom-0 w-full bg-[#0F172A]/95 backdrop-blur-md border-t border-gray-800">
      <div class="max-w-[375px] mx-auto">
        <div class="grid grid-cols-3 h-16">
          <router-link to="/" class="flex flex-col items-center justify-center text-gray-500">
            <i class="ri-line-chart-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5" v-text="t('nav.market')"></span>
          </router-link>
          <router-link to="/points" class="flex flex-col items-center justify-center text-gray-500">
            <i class="ri-coin-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5" v-text="t('nav.points')"></span>
          </router-link>
          <router-link to="/profile" class="flex flex-col items-center justify-center text-primary border-t-2 border-primary">
            <i class="ri-settings-3-line ri-lg w-6 h-6 flex items-center justify-center"></i>
            <span class="text-xs mt-0.5" v-text="t('nav.settings')"></span>
          </router-link>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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
const currentLanguage = ref(locale.value)

// 监听语言变化
watch(locale, (newLocale) => {
  currentLanguage.value = newLocale
})

// 获取当前语言的名称
const getCurrentLanguageName = (): string => {
  // 使用 currentLanguage.value 而不是 locale.value
  const langCode = currentLanguage.value
  const lang = languages.find(l => l.code === langCode)
  return lang ? lang.name : 'Unknown'
}

// 支持的语言列表
const languages = [
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

  // 检查是否与当前语言相同，如果相同则只关闭模态框
  if (currentLanguage.value === lang) {
    showLanguageModal.value = false;
    return;
  }

  // 关闭模态框（先关闭，避免模态框中的文本更新导致闪烁）
  showLanguageModal.value = false;

  // 立即更新当前组件的语言
  currentLanguage.value = lang;

  // 如果用户已登录，更新用户信息
  if (isLoggedIn.value) {
    updateUserLanguage(lang);
  }

  // 设置新语言（这会触发全局语言变更事件）
  // 注意：setLanguage 函数内部会处理语言变更事件和强制刷新
  setLanguage(lang);

  // 不再需要额外触发事件，避免重复触发
  // 移除以下代码以避免多次触发语言变更事件
  /*
  setTimeout(() => {

    // 强制重新渲染当前组件
    const app = document.getElementById('app');
    if (app) {
      app.classList.add('force-rerender');
      setTimeout(() => {
        app.classList.remove('force-rerender');
      }, 10);
    }

    // 触发自定义事件，通知组件刷新
    window.dispatchEvent(new CustomEvent('profile-language-changed', { detail: { language: lang } }));
  }, 100);
  */
}

const isLoggedIn = computed(() => {
  return !!localStorage.getItem('token')
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)

  // 根据当前语言选择区域设置
  let locale = 'en-US';
  const currentLang = localStorage.getItem('language');

  if (currentLang === 'zh-CN') locale = 'zh-CN';
  else if (currentLang === 'ja-JP') locale = 'ja-JP';
  else if (currentLang === 'ko-KR') locale = 'ko-KR';


  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchUserInfo = async () => {
  if (!isLoggedIn.value) return;

  try {

    // 先尝试从本地存储获取用户信息
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      try {
        const parsedInfo = JSON.parse(savedUserInfo);
        userInfo.value = parsedInfo;
      } catch (e) {
      }
    }

    // 检查是否在扩展环境中
    const isExtension = window.location.protocol === 'chrome-extension:';
    if (isExtension) {
      return;
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
    // 在扩展环境中，只更新本地存储，不发送 API 请求
    const isExtension = window.location.protocol === 'chrome-extension:';

    if (!isExtension) {
      // 在网页环境中，发送 API 请求
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
    } else {
    }

    // 更新本地用户信息
    userInfo.value.language = lang;
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value));
  } catch (error) {

    // 即使 API 请求失败，也更新本地存储
    userInfo.value.language = lang;
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value));
  }
}

const handleLogout = () => {
  // 清除本地存储
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  // 跳转到登录页
  router.push('/login')
}

// 设置语言变更监听器
const setupLanguageChangeListener = () => {
  // 用于防止重复处理的变量
  let lastProcessedLang = localStorage.getItem('language') || 'en-US';
  let lastProcessedTime = Date.now();

  // 监听语言变更事件
  window.addEventListener('language-changed', (event) => {
    const newLang = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US';

    // 防止短时间内重复处理相同的语言
    const now = Date.now();
    if (newLang === lastProcessedLang && now - lastProcessedTime < 1000) {
      return;
    }

    currentLanguage.value = newLang;
    lastProcessedLang = newLang;
    lastProcessedTime = now;
  });

  // 监听强制刷新事件
  window.addEventListener('force-refresh-i18n', () => {
    const newLang = localStorage.getItem('language') || 'en-US';

    // 防止短时间内重复处理相同的语言
    const now = Date.now();
    if (newLang === lastProcessedLang && now - lastProcessedTime < 1000) {
      return;
    }

    currentLanguage.value = newLang;
    lastProcessedLang = newLang;
    lastProcessedTime = now;
  });
}

onMounted(async () => {
  // 先获取用户信息
  await fetchUserInfo();

  // 确保当前语言与存储的语言一致
  const storedLang = localStorage.getItem('language') || 'en-US';

  // 如果用户已登录，优先使用用户的语言设置
  if (isLoggedIn.value && userInfo.value.language) {
    // 只有当用户语言与当前语言不同时才设置
    if (userInfo.value.language !== storedLang) {
      setLanguage(userInfo.value.language);
    } else {
      // 确保当前组件的语言与存储的语言一致
      currentLanguage.value = storedLang;
    }
  } else {
    // 确保当前组件的语言与存储的语言一致
    currentLanguage.value = storedLang;
  }

  // 设置语言变更监听器
  setupLanguageChangeListener();
})
</script>