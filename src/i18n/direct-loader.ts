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
  
  // 获取当前语言的消息对象
  let value: any = messages[currentLocale as keyof typeof messages]
  
  // 遍历键路径
  for (const k of keys) {
    // 如果路径中的任何一部分不存在，则找不到翻译
    if (value === undefined || value === null) return key
    value = value[k]
  }
  
  // 如果找到的值是 undefined 或 null，则找不到翻译
  if (value === undefined || value === null) return key
  
  // 如果找到的值是字符串，并且有参数，则替换参数
  if (typeof value === 'string' && params) {
    return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
      return str.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue))
    }, value) // 使用找到的字符串值作为累加器的初始值
  }
  
  // 如果找到的值不是字符串，或者没有参数，返回原始值（如果不是字符串，通常返回键名）
  // 根据 vue-i18n 的行为，如果翻译值不是字符串，它通常直接返回该值。
  // 但为了确保函数返回类型是 string，这里强制转换为 string。
  // 更安全的方式是如果不是字符串就返回 key，但考虑到实际语言文件结构，强制转换应该可以。
  return String(value)
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
