/**
 * i18n 辅助函数
 * 提供在扩展环境中更可靠的国际化支持
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import directI18n, { t as directT } from '@/i18n/direct-loader'

/**
 * 检测当前是否在扩展环境中
 */
export const isExtensionEnvironment = computed(() => {
  return (
    window.location.protocol.includes('extension') ||
    window.location.protocol.includes('chrome') ||
    window.location.protocol.includes('moz')
  )
})

/**
 * 创建一个增强的翻译函数，在扩展环境中优先使用直接加载器
 * @returns 翻译函数
 */
export const useEnhancedI18n = () => {
  const { t: vueT, locale } = useI18n()

  // 添加调试信息
  const isDebug = localStorage.getItem('i18n_debug') === 'true';

  // 确保 locale 与 localStorage 中的语言设置同步
  const syncLocale = () => {
    const storedLang = localStorage.getItem('language');
    if (storedLang && ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(storedLang) && storedLang !== locale.value) {
      if (isDebug) {
        console.log(`[i18n-helper] 同步 locale，从 ${locale.value} 更新为 ${storedLang}`);
      }
      locale.value = storedLang as any;
    }
  };

  // 初始同步
  syncLocale();

  // 监听语言变更事件
  window.addEventListener('language-changed', (event) => {
    const newLang = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US';
    if (isDebug) {
      console.log(`[i18n-helper] 收到语言变更事件: ${newLang}`);
    }
    locale.value = newLang as any;
  });

  // 监听强制刷新事件
  window.addEventListener('force-refresh-i18n', () => {
    syncLocale();
    if (isDebug) {
      console.log(`[i18n-helper] 收到强制刷新事件，当前语言: ${locale.value}`);
    }
  });

  /**
   * 增强的翻译函数
   * 在扩展环境中优先使用直接加载器
   * @param key 翻译键
   * @returns 翻译结果
   */
  const t = (key: string, params?: Record<string, any>) => {
    // 每次翻译前同步语言设置
    syncLocale();

    // 在扩展环境中，优先使用直接加载器
    if (isExtensionEnvironment.value) {
      if (isDebug) {
        console.log(`[i18n-helper] 使用直接加载器翻译: ${key}, 当前语言: ${locale.value}`);
      }
      const result = directT(key, params)
      // 如果直接加载器返回的结果就是键名，尝试使用 vue-i18n
      if (result === key) {
        const vueResult = vueT(key, params)
        // 如果 vue-i18n 也返回键名，使用直接加载器的结果
        return vueResult === key ? result : vueResult
      }
      return result
    }
    // 在非扩展环境中，使用 vue-i18n
    if (isDebug) {
      console.log(`[i18n-helper] 使用 vue-i18n 翻译: ${key}, 当前语言: ${locale.value}`);
    }
    return vueT(key, params)
  }

  return {
    t,
    locale
  }
}

/**
 * 设置当前语言
 * @param locale 语言代码
 */
export const setLocale = (locale: string) => {
  // 使用直接加载器设置语言
  directI18n.setLocale(locale)
}

/**
 * 获取当前语言
 * @returns 当前语言代码
 */
export const getLocale = () => {
  // 使用直接加载器获取语言
  return directI18n.getLocale()
}

/**
 * 获取所有可用语言
 * @returns 所有可用语言代码
 */
export const getAvailableLocales = () => {
  // 使用直接加载器获取所有可用语言
  return directI18n.getAvailableLocales()
}

export default {
  isExtensionEnvironment,
  useEnhancedI18n,
  setLocale,
  getLocale,
  getAvailableLocales
}
