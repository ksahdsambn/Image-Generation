import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { getRuntimeConfig } from '@/config/appConfig'
import './styles/main.css'

const runtimeConfig = getRuntimeConfig()
document.title = runtimeConfig.config.appTitle

createApp(App).use(createPinia()).mount('#app')
