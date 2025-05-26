<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const isDevelopment = ref(process.env.NODE_ENV !== 'production')

onMounted(() => {
  // 设置环境变量
  const isDevelopment = process.env.NODE_ENV === 'development';
  localStorage.setItem('env', isDevelopment ? 'development' : 'production');

  // 设置API基础URL
  const baseApiUrl = isDevelopment ? 'http://192.168.3.16:8000/api' : 'https://www.cooltrade.xyz/api';
  localStorage.setItem('baseApiUrl', baseApiUrl);

  // 向 background script 发送环境配置
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    const token = localStorage.getItem('token');

    // 发送环境配置
    chrome.runtime.sendMessage({
      type: 'SET_ENV_CONFIG',
      data: {
        baseApiUrl: baseApiUrl,
        env: isDevelopment ? 'development' : 'production',
        token: token
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

  if (['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(storedLang)) {
    // 设置 Vue I18n 的 locale
    locale.value = storedLang

    // 同时设置直接加载器的语言
    try {
      import('./i18n/direct-loader').then(directLoader => {
        directLoader.setLocale(storedLang);
      });
    } catch (e) {
      console.error('Failed to load direct loader:', e);
    }

    // 触发语言变更事件
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { language: storedLang } }));

    // 强制刷新所有组件
    setTimeout(() => {
      window.dispatchEvent(new Event('force-refresh-i18n'));
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

    // 同时设置直接加载器的语言
    try {
      import('./i18n/direct-loader').then(directLoader => {
        directLoader.setLocale(detectedLang);
      });
    } catch (e) {
      console.error('Failed to load direct loader:', e);
    }

    // 触发语言变更事件
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { language: detectedLang } }));

    // 强制刷新所有组件
    setTimeout(() => {
      window.dispatchEvent(new Event('force-refresh-i18n'));
    }, 100);
  }

  // 监听语言变更事件
  window.addEventListener('language-changed', (event) => {
    const newLang = (event as CustomEvent).detail?.language || localStorage.getItem('language') || 'en-US';
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
