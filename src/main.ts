import './styles/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import { createPinia } from 'pinia'
import 'remixicon/fonts/remixicon.css'
import 'element-plus/dist/index.css'
import i18n from './i18n'
import { i18nDirectPlugin } from './i18n/direct-loader'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(i18nDirectPlugin)

app.mount('#app')
