import './styles/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import { createPinia } from 'pinia'
import 'remixicon/fonts/remixicon.css'
import 'element-plus/dist/index.css'
import i18n from './i18n' // 导入i18n配置
import directI18n, { i18nDirectPlugin } from './i18n/direct-loader' // 导入直接加载器作为备用方案

// 详细调试 i18n 加载情况
console.log('=== I18N DEBUG START ===')
console.log('Available languages:', Object.keys(i18n.global.messages.value))

// 检查每种语言的消息是否正确加载
const languages = Object.keys(i18n.global.messages.value)
languages.forEach(lang => {
  const messages = i18n.global.messages.value[lang]
  console.log(`Language ${lang} loaded:`, !!messages)

  // 检查关键消息是否存在
  if (messages) {
    console.log(`Sample translations for ${lang}:`)
    console.log('- auth.login:', messages.auth?.login || 'NOT FOUND')
    console.log('- auth.email:', messages.auth?.email || 'NOT FOUND')
    console.log('- common.loading:', messages.common?.loading || 'NOT FOUND')
  }
})

// 检查当前语言
console.log('Current locale:', i18n.global.locale.value)
console.log('=== I18N DEBUG END ===')

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n) // 使用i18n
app.use(i18nDirectPlugin) // 使用直接加载器作为备用方案

// 全局属性，方便调试
app.config.globalProperties.$i18n = i18n
app.config.globalProperties.$t = i18n.global.t

// 添加一个全局变量，用于检测 i18n 是否正常工作
try {
  const testTranslation = i18n.global.t('auth.login')
  const isWorking = testTranslation !== 'auth.login'
  console.log('I18n working properly:', isWorking)

  // 检测是否在扩展环境中
  const isExtension = window.location.protocol.includes('extension') ||
                      window.location.protocol.includes('chrome') ||
                      window.location.protocol.includes('moz')

  console.log('Running in extension environment:', isExtension)

  // 更新调试信息
  if (window.i18nDebug) {
    window.i18nDebug.loaded = isWorking
    window.i18nDebug.languages = Object.keys(i18n.global.messages.value)
    window.i18nDebug.currentLocale = i18n.global.locale.value
    window.i18nDebug.isExtension = isExtension

    // 添加一个测试函数
    window.i18nDebug.test = function(key) {
      try {
        return {
          key: key,
          result: i18n.global.t(key),
          directResult: directI18n.t(key),
          isExtension: isExtension
        }
      } catch (e) {
        return { error: e.message }
      }
    }
  }
} catch (e) {
  console.error('Error testing i18n:', e)
  if (window.i18nDebug) {
    window.i18nDebug.error = e.message
  }
}

app.mount('#app')
