import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import jaJP from './locales/ja-JP'
import koKR from './locales/ko-KR'

// 获取浏览器语言
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language || (navigator as any).userLanguage
  // 将浏览器语言映射到我们支持的语言
  if (browserLang.startsWith('zh')) return 'zh-CN'
  if (browserLang.startsWith('en')) return 'en-US'
  if (browserLang.startsWith('ja')) return 'ja-JP'
  if (browserLang.startsWith('ko')) return 'ko-KR'
  return 'en-US' // 默认语言
}

// 获取用户设置的语言或浏览器语言
const getPreferredLanguage = (): string => {
  // 首先尝试从localStorage获取用户设置的语言
  const storedLang = localStorage.getItem('language')
  if (storedLang) return storedLang

  // 如果没有设置，使用浏览器语言
  return getBrowserLanguage()
}

// 创建i18n实例
const i18n = createI18n({
  legacy: false, // 使用组合式API
  locale: getPreferredLanguage(),
  fallbackLocale: 'en-US',
  globalInjection: true, // 确保全局注入
  allowComposition: true, // 允许组合式API
  missingWarn: false, // 禁用缺失翻译警告
  fallbackWarn: false, // 禁用回退警告
  silentTranslationWarn: true, // 禁用翻译警告
  silentFallbackWarn: true, // 禁用回退警告
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'ja-JP': jaJP,
    'ko-KR': koKR
  }
})

// 设置语言的方法
type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

export const setLanguage = (lang: string) => {
  if (['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(lang)) {
    localStorage.setItem('language', lang)
    i18n.global.locale.value = lang as SupportedLanguage

    // 如果用户已登录，更新用户的语言偏好
    const token = localStorage.getItem('token')
    if (token) {
      // 调用API更新用户语言偏好
      updateUserLanguagePreference(lang)
    }
  }
}

// 更新用户语言偏好的API调用
const updateUserLanguagePreference = async (lang: string) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    const response = await fetch('http://192.168.3.16:8000/api/auth/profile/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ language: lang })
    })

    if (!response.ok) {
      console.error('更新用户语言偏好失败')
    }
  } catch (error) {
    console.error('更新用户语言偏好时出错:', error)
  }
}

export default i18n
