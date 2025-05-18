<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const isDevelopment = ref(process.env.NODE_ENV !== 'production')

onMounted(() => {
  // 确保在应用挂载时正确设置语言
  let storedLang = localStorage.getItem('language')
  if (!storedLang) {
    localStorage.setItem('language', 'en-US')
    storedLang = 'en-US'
  }
  if (['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(storedLang)) {
    locale.value = storedLang
  } else {
    // 如果没有存储的语言，使用浏览器语言
    const browserLang = navigator.language || (navigator as any).userLanguage
    if (browserLang.startsWith('zh')) locale.value = 'zh-CN'
    else if (browserLang.startsWith('ja')) locale.value = 'ja-JP'
    else if (browserLang.startsWith('ko')) locale.value = 'ko-KR'
    else locale.value = 'en-US' // 默认英语
  }
})
</script>

<template>
  <router-view />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
</style>
