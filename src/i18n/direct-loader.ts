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

// 调试模式标志
const isDebug = localStorage.getItem('i18n_debug') === 'true';

// 导入 i18n 调试工具
import { initI18nDebug } from '../i18n-debug';

// 初始化调试工具
let i18nDebug: ReturnType<typeof initI18nDebug> | null = null;

// 如果启用了调试模式，初始化调试工具
if (isDebug) {
  i18nDebug = initI18nDebug();
}

// 初始化时获取语言
function initLocale() {
  // 尝试从 localStorage 获取
  const storedLang = localStorage.getItem('language')
  if (storedLang && ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(storedLang)) {
    currentLocale = storedLang
    if (isDebug && i18nDebug) {
      i18nDebug.log(`初始化语言从 localStorage: ${storedLang}`);
    }
    return
  }

  // 否则使用浏览器语言
  const browserLang = navigator.language || (navigator as any).userLanguage
  if (browserLang.startsWith('zh')) currentLocale = 'zh-CN'
  else if (browserLang.startsWith('ja')) currentLocale = 'ja-JP'
  else if (browserLang.startsWith('ko')) currentLocale = 'ko-KR'
  else currentLocale = 'en-US'

  if (isDebug && i18nDebug) {
    i18nDebug.log(`初始化语言从浏览器: ${browserLang} -> ${currentLocale}`);
  }
}

// 初始化
initLocale()

// 翻译函数
export function t(key: string, params?: Record<string, any>): string {
  // 重新检查调试状态，以防在运行时更改
  if (isDebug && !i18nDebug) {
    i18nDebug = initI18nDebug();
  }

  // 每次翻译时重新获取当前语言，以确保使用最新的语言设置
  const storedLang = localStorage.getItem('language');
  if (storedLang && ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(storedLang) && storedLang !== currentLocale) {
    if (isDebug && i18nDebug) {
      i18nDebug.log(`翻译时发现语言不一致，从 ${currentLocale} 更新为 ${storedLang}`);
    }
    currentLocale = storedLang;
  }

  // 分割键，例如 'auth.login' => ['auth', 'login']
  const keys = key.split('.')

  // 获取当前语言的消息对象
  let value: any = messages[currentLocale as keyof typeof messages]

  if (isDebug && i18nDebug) {
    i18nDebug.log(`翻译键: ${key}, 当前语言: ${currentLocale}`);
    i18nDebug.log(`语言数据可用性:`, {
      'zh-CN': !!messages['zh-CN'],
      'en-US': !!messages['en-US'],
      'ja-JP': !!messages['ja-JP'],
      'ko-KR': !!messages['ko-KR']
    });
  }

  // 遍历键路径
  for (const k of keys) {
    // 如果路径中的任何一部分不存在，则找不到翻译
    if (value === undefined || value === null) {
      if (isDebug && i18nDebug) {
        i18nDebug.log(`键路径中断: ${k} 不存在`);
      }
      return key;
    }
    value = value[k]
  }

  // 如果找到的值是 undefined 或 null，则找不到翻译
  if (value === undefined || value === null) {
    if (isDebug && i18nDebug) {
      i18nDebug.log(`未找到翻译值`);
    }
    return key;
  }

  // 如果找到的值是字符串，并且有参数，则替换参数
  if (typeof value === 'string' && params) {
    if (isDebug && i18nDebug) {
      i18nDebug.log(`找到翻译: ${value}, 替换参数:`, params);
    }
    return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
      return str.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue))
    }, value) // 使用找到的字符串值作为累加器的初始值
  }

  // 如果找到的值不是字符串，或者没有参数，返回原始值
  if (isDebug && i18nDebug) {
    i18nDebug.log(`找到翻译: ${value}, 类型: ${typeof value}`);
  }

  // 根据 vue-i18n 的行为，如果翻译值不是字符串，它通常直接返回该值。
  // 但为了确保函数返回类型是 string，这里强制转换为 string。
  return String(value)
}

// 设置语言
export function setLocale(locale: string) {
  if (['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(locale)) {
    // 记录旧语言，用于调试
    const oldLocale = currentLocale

    // 更新当前语言
    currentLocale = locale
    localStorage.setItem('language', locale)

    // 记录语言变更
    if (isDebug && i18nDebug) {
      i18nDebug.log(`直接加载器语言从 ${oldLocale} 变更为 ${locale}`);

      // 使用新的方法更新调试工具中的当前语言
      if ('updateCurrentLocale' in i18nDebug) {
        (i18nDebug as any).updateCurrentLocale(locale);
      }
    }

    // 触发自定义事件，通知语言变化
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
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
