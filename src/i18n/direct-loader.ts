/**
 * 直接加载语言文件的简单实现
 * 这是一个备用方案，用于在 vue-i18n 不工作时使用
 */

import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import jaJP from './locales/ja-JP'
import koKR from './locales/ko-KR'

// 所有语言数据
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR
}

// 当前语言
let currentLocale = 'en-US'

// 初始化时获取语言
function initLocale() {
  // 尝试从 localStorage 获取
  const storedLang = localStorage.getItem('language')
  if (storedLang && ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(storedLang)) {
    currentLocale = storedLang
    return
  }

  // 否则使用浏览器语言
  const browserLang = navigator.language || (navigator as any).userLanguage
  if (browserLang.startsWith('zh')) currentLocale = 'zh-CN'
  else if (browserLang.startsWith('ja')) currentLocale = 'ja-JP'
  else if (browserLang.startsWith('ko')) currentLocale = 'ko-KR'
  else currentLocale = 'en-US'
}

// 初始化
initLocale()

// 翻译函数
export function t(key: string, params?: Record<string, any>): string {
  // 分割键，例如 'auth.login' => ['auth', 'login']
  const keys = key.split('.')
  
  // 获取当前语言的消息
  let result = messages[currentLocale]
  
  // 遍历键路径
  for (const k of keys) {
    if (!result) return key
    result = result[k]
  }
  
  // 如果没有找到翻译，返回键名
  if (!result) return key
  
  // 如果有参数，替换参数
  if (params && typeof result === 'string') {
    return Object.entries(params).reduce((str, [key, value]) => {
      return str.replace(new RegExp(`{${key}}`, 'g'), String(value))
    }, result)
  }
  
  return result as string
}

// 设置语言
export function setLocale(locale: string) {
  if (['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(locale)) {
    currentLocale = locale
    localStorage.setItem('language', locale)
    
    // 触发自定义事件，通知语言变化
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }))
  }
}

// 获取当前语言
export function getLocale(): string {
  return currentLocale
}

// 获取所有可用语言
export function getAvailableLocales(): string[] {
  return Object.keys(messages)
}

// 创建一个 Vue 插件
export const i18nDirectPlugin = {
  install(app: any) {
    // 全局属性
    app.config.globalProperties.$td = t
    app.config.globalProperties.$locale = {
      get: getLocale,
      set: setLocale,
      available: getAvailableLocales()
    }
    
    // 提供一个全局指令
    app.directive('t', {
      mounted(el: HTMLElement, binding: any) {
        el.textContent = t(binding.value)
      },
      updated(el: HTMLElement, binding: any) {
        el.textContent = t(binding.value)
      }
    })
  }
}

// 导出默认对象
export default {
  t,
  setLocale,
  getLocale,
  getAvailableLocales,
  plugin: i18nDirectPlugin
}
