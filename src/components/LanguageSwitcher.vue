<template>
  <div class="language-switcher">
    <select v-model="currentLanguage" @change="changeLanguage" class="language-select">
      <option value="en-US">English</option>
      <option value="zh-CN">中文</option>
      <option value="ja-JP">日本語</option>
      <option value="ko-KR">한국어</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/i18n'

const { locale } = useI18n()
const currentLanguage = ref(locale.value)

// 监听全局语言变化
watch(locale, (newLocale) => {
  console.log(`[LanguageSwitcher] 检测到语言变化: ${newLocale}`);
  currentLanguage.value = newLocale;
});

onMounted(() => {
  // 确保组件挂载时使用正确的语言
  currentLanguage.value = locale.value;
  console.log(`[LanguageSwitcher] 组件挂载，当前语言: ${locale.value}`);

  // 监听全局强制刷新事件
  window.addEventListener('force-refresh-i18n', () => {
    console.log(`[LanguageSwitcher] 收到强制刷新事件，当前语言: ${locale.value}`);
    currentLanguage.value = locale.value;
  });
})

const changeLanguage = () => {
  setLanguage(currentLanguage.value)
  // 可选：重新加载页面以确保所有组件都使用新语言
  // window.location.reload()
}
</script>

<style scoped>
.language-switcher {
  margin: 10px;
}

.language-select {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: #fff;
  color: #333;
}
</style>
