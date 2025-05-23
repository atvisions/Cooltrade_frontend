<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { initI18nDebug } from './i18n-debug'

const { locale } = useI18n()
const isDevelopment = ref(process.env.NODE_ENV !== 'production')
const i18nDebug = initI18nDebug()

onMounted(() => {
  // 启用调试模式
  localStorage.setItem('i18n_debug', 'true');

  // 设置环境变量
  const isDevelopment = process.env.NODE_ENV === 'development';
  localStorage.setItem('env', isDevelopment ? 'development' : 'production');
  console.log(`[App] 设置环境为: ${isDevelopment ? 'development' : 'production'}`);

  // 设置API基础URL
  const baseApiUrl = isDevelopment ? 'http://192.168.3.16:8000/api' : 'https://www.cooltrade.xyz/api';
  localStorage.setItem('baseApiUrl', baseApiUrl);
  console.log(`[App] 设置API基础URL为: ${baseApiUrl}`);

  // 向 background script 发送环境配置
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    const token = localStorage.getItem('token');
    console.log(`[App] 向 background script 发送环境配置，token: ${token ? '已设置' : '未设置'}`);

    // 发送环境配置
    chrome.runtime.sendMessage({
      type: 'SET_ENV_CONFIG',
      data: {
        baseApiUrl: baseApiUrl,
        env: isDevelopment ? 'development' : 'production',
        token: token
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[App] 向 background script 发送环境配置失败:', chrome.runtime.lastError);
      } else {
        console.log('[App] 向 background script 发送环境配置成功:', response);
      }
    });
  }

  // 确保在应用挂载时正确设置语言
  let storedLang = localStorage.getItem('language')
  if (!storedLang) {
    localStorage.setItem('language', 'en-US')
    storedLang = 'en-US'
  }

  // 检查是否在扩展环境中
  const isExtension = window.location.protocol.includes('extension') ||
                      window.location.protocol.includes('chrome') ||
                      window.location.protocol.includes('moz');

  // 在扩展环境中，确保语言文件已加载
  if (isExtension) {
    i18nDebug.log('在扩展环境中运行，确保语言文件已加载');

    // 检查语言文件是否已加载
    // 使用 useI18n() 返回的 locale 对象的 __i18n 属性获取 i18n 实例
    const i18nInstance = (locale as any).__i18n;
    const messages = i18nInstance ? (i18nInstance.global?.messages?.value || {}) : {};

    // 检查是否所有语言都已加载
    const hasLanguages = messages &&
                        messages['zh-CN'] &&
                        messages['en-US'] &&
                        messages['ja-JP'] &&
                        messages['ko-KR'];

    // 更新调试状态
    i18nDebug.updateStatus({
      loaded: !!hasLanguages,
      languages: Object.keys(messages || {}),
      currentLocale: locale.value || 'unknown'
    });

    if (!hasLanguages) {
      i18nDebug.log('语言文件未完全加载，尝试使用直接加载器');
    }
  }

  if (['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(storedLang)) {
    // 设置 Vue I18n 的 locale
    locale.value = storedLang
    console.log(`[App] 设置语言为: ${storedLang}`);

    // 同时设置直接加载器的语言
    try {
      import('./i18n/direct-loader').then(directLoader => {
        directLoader.setLocale(storedLang);
        console.log(`[App] 直接加载器语言已设置为: ${storedLang}`);
      });
    } catch (e) {
      console.error('[App] 设置直接加载器语言失败:', e);
    }

    // 触发语言变更事件
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { language: storedLang } }));

    // 强制刷新所有组件
    setTimeout(() => {
      window.dispatchEvent(new Event('force-refresh-i18n'));
      console.log(`[App] 已触发强制刷新事件，语言: ${storedLang}`);
    }, 100);
  } else {
    // 如果没有存储的语言，使用浏览器语言
    const browserLang = navigator.language || (navigator as any).userLanguage
    let detectedLang = 'en-US'; // 默认英语

    if (browserLang.startsWith('zh')) detectedLang = 'zh-CN'
    else if (browserLang.startsWith('ja')) detectedLang = 'ja-JP'
    else if (browserLang.startsWith('ko')) detectedLang = 'ko-KR'

    // 设置 Vue I18n 的 locale
    locale.value = detectedLang

    // 保存到本地存储
    localStorage.setItem('language', detectedLang);

    console.log(`[App] 根据浏览器语言设置为: ${detectedLang}`);

    // 同时设置直接加载器的语言
    try {
      import('./i18n/direct-loader').then(directLoader => {
        directLoader.setLocale(detectedLang);
        console.log(`[App] 直接加载器语言已设置为: ${detectedLang}`);
      });
    } catch (e) {
      console.error('[App] 设置直接加载器语言失败:', e);
    }

    // 触发语言变更事件
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { language: detectedLang } }));

    // 强制刷新所有组件
    setTimeout(() => {
      window.dispatchEvent(new Event('force-refresh-i18n'));
      console.log(`[App] 已触发强制刷新事件，语言: ${detectedLang}`);
    }, 100);
  }

  // 监听语言变更事件
  window.addEventListener('language-changed', (event) => {
    const newLang = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US';
    console.log(`[App] 收到语言变更事件: ${newLang}`);

    // 设置 Vue I18n 的 locale
    locale.value = newLang;

    // 强制重新渲染应用
    const app = document.getElementById('app');
    if (app) {
      app.classList.add('force-rerender');
      setTimeout(() => {
        app.classList.remove('force-rerender');
      }, 10);
    }
  });
})
</script>

<template>
  <router-view />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* 强制重新渲染的样式 */
.force-rerender {
  animation: force-rerender-animation 0.01s;
}

@keyframes force-rerender-animation {
  0% { opacity: 0.99; }
  100% { opacity: 1; }
}
</style>
