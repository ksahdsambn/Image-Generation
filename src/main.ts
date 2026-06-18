import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { useSkillStore } from '@/stores/skill'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.mount('#app')

// 应用启动后异步加载用户自定义 skill 列表（不阻塞渲染，失败仅记录到 store.error）
useSkillStore(pinia).loadCustomSkills().catch(() => {
  // 加载失败已在 store 内记录，这里静默吞掉，避免未处理的 Promise 拒绝
})
