import { createI18n } from 'vue-i18n'

// 直接导入语言文件，确保它们被包含在主 JavaScript 文件中
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import jaJP from './locales/ja-JP'
import koKR from './locales/ko-KR'

// 确保语言文件被正确加载

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
  },
  // 确保在编译后能够正确加载语言文件
  warnHtmlMessage: false,
  escapeParameter: true,
  runtimeOnly: false
})

// 设置语言的方法
type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

export const setLanguage = (lang: string) => {
  // 确保语言代码有效
  if (['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(lang)) {
    // 记录旧语言，用于调试
    const oldLang = localStorage.getItem('language') || 'en-US';

    // 如果语言没有变化，不执行后续操作
    if (oldLang === lang) {
      return;
    }

    // 保存到本地存储
    localStorage.setItem('language', lang);

    // 设置 i18n 全局语言
    i18n.global.locale.value = lang as SupportedLanguage;

    // 同时设置直接加载器的语言
    try {
      // 导入直接加载器
      import('./direct-loader').then(directLoader => {
        directLoader.setLocale(lang);
      });
    } catch (e) {
    }

    // 移除调试工具相关代码

    // 如果用户已登录，更新用户的语言偏好
    const token = localStorage.getItem('token');
    if (token) {
      // 调用API更新用户语言偏好
      updateUserLanguagePreference(lang);
    }

    // 触发语言变更事件，通知其他组件重新加载数据
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { language: lang } }));

    // 强制刷新所有组件
    setTimeout(() => {
      // 触发一个全局事件，通知所有组件重新渲染
      window.dispatchEvent(new Event('force-refresh-i18n'));
    }, 100); // 增加延迟，确保语言设置已完成
  } else {
  }
}

// 更新用户语言偏好的API调用
const updateUserLanguagePreference = async (lang: string) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    // 检查是否在扩展环境中
    const isExtension = window.location.protocol === 'chrome-extension:';

    if (isExtension) {

      // 在扩展环境中，只更新本地存储
      try {
        const userInfoStr = localStorage.getItem('userInfo')
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr)
          userInfo.language = lang
          localStorage.setItem('userInfo', JSON.stringify(userInfo))
        }
      } catch (e) {
      }

      return;
    }

    // 在网页环境中，发送 API 请求
    // 使用相对路径，避免硬编码URL
    const url = '/api/auth/profile/';

    // 使用fetch发送请求
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ language: lang })
    })

    if (!response.ok) {
    } else {

      // 更新本地用户信息
      try {
        const userInfoStr = localStorage.getItem('userInfo')
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr)
          userInfo.language = lang
          localStorage.setItem('userInfo', JSON.stringify(userInfo))
        }
      } catch (e) {
      }
    }
  } catch (error) {
  }
}

export default i18n
