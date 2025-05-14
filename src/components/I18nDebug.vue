<template>
  <div class="i18n-debug" v-if="showDebug">
    <div class="debug-header">
      <h3>I18n Debug</h3>
      <button @click="showDebug = false">Close</button>
    </div>
    <div class="debug-content">
      <p><strong>Current Locale:</strong> {{ currentLocale }}</p>
      <p><strong>Available Locales:</strong> {{ availableLocales.join(', ') }}</p>
      <p><strong>Messages Loaded:</strong> {{ messagesLoaded ? 'Yes' : 'No' }}</p>
      <div v-if="messagesLoaded">
        <p><strong>Sample Translations:</strong></p>
        <ul>
          <li>auth.login: {{ t('auth.login') }}</li>
          <li>auth.email: {{ t('auth.email') }}</li>
          <li>auth.password: {{ t('auth.password') }}</li>
          <li>common.loading: {{ t('common.loading') }}</li>
        </ul>
      </div>
      <div class="debug-actions">
        <button @click="setLanguage('en-US')">English</button>
        <button @click="setLanguage('zh-CN')">中文</button>
        <button @click="setLanguage('ja-JP')">日本語</button>
        <button @click="setLanguage('ko-KR')">한국어</button>
      </div>
    </div>
  </div>
  <button class="debug-toggle" @click="showDebug = !showDebug" v-if="!showDebug">
    Debug I18n
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLanguage } from '@/i18n'

const { t, locale, availableLocales } = useI18n()
const showDebug = ref(false)

const currentLocale = computed(() => locale.value)
const messagesLoaded = computed(() => {
  try {
    // 尝试获取一个翻译，如果成功则说明消息已加载
    const test = t('auth.login')
    return test !== 'auth.login'
  } catch (e) {
    return false
  }
})
</script>

<style scoped>
.i18n-debug {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  z-index: 9999;
  max-width: 300px;
  font-size: 12px;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.debug-header h3 {
  margin: 0;
}

.debug-content {
  margin-bottom: 10px;
}

.debug-actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.debug-actions button, .debug-header button, .debug-toggle {
  background-color: #4a5568;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.debug-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}
</style>
