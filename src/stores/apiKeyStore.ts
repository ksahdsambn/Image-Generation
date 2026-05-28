import { defineStore } from 'pinia'

const SESSION_API_KEY = 'gpt-image-2.session-api-key'
const LOCAL_API_KEY = 'gpt-image-2.remembered-api-key'
const LOCAL_REMEMBER_KEY = 'gpt-image-2.remember-api-key'

export const apiKeyStorageKeys = {
  sessionApiKey: SESSION_API_KEY,
  localApiKey: LOCAL_API_KEY,
  localRememberKey: LOCAL_REMEMBER_KEY,
} as const

type ApiKeyState = {
  apiKey: string
  rememberKey: boolean
  isKeyVisible: boolean
}

export const useApiKeyStore = defineStore('apiKey', {
  state: (): ApiKeyState => ({
    apiKey: '',
    rememberKey: false,
    isKeyVisible: false,
  }),
  getters: {
    hasApiKey: (state) => state.apiKey.trim().length > 0,
  },
  actions: {
    hydrate() {
      const remembered = localStorage.getItem(LOCAL_REMEMBER_KEY) === 'true'
      this.rememberKey = remembered
      this.apiKey = remembered
        ? localStorage.getItem(LOCAL_API_KEY) || ''
        : sessionStorage.getItem(SESSION_API_KEY) || ''

      if (!remembered) {
        localStorage.removeItem(LOCAL_API_KEY)
      }
    },
    setApiKey(value: string) {
      this.apiKey = value

      if (this.rememberKey) {
        localStorage.setItem(LOCAL_REMEMBER_KEY, 'true')
        localStorage.setItem(LOCAL_API_KEY, value)
        sessionStorage.removeItem(SESSION_API_KEY)
        return
      }

      sessionStorage.setItem(SESSION_API_KEY, value)
      localStorage.removeItem(LOCAL_API_KEY)
      localStorage.setItem(LOCAL_REMEMBER_KEY, 'false')
    },
    setRememberKey(value: boolean) {
      this.rememberKey = value

      if (value) {
        localStorage.setItem(LOCAL_REMEMBER_KEY, 'true')
        localStorage.setItem(LOCAL_API_KEY, this.apiKey)
        sessionStorage.removeItem(SESSION_API_KEY)
        return
      }

      localStorage.setItem(LOCAL_REMEMBER_KEY, 'false')
      localStorage.removeItem(LOCAL_API_KEY)
      if (this.apiKey) {
        sessionStorage.setItem(SESSION_API_KEY, this.apiKey)
      }
    },
    toggleKeyVisibility() {
      this.isKeyVisible = !this.isKeyVisible
    },
    clearApiKey() {
      this.apiKey = ''
      this.rememberKey = false
      this.isKeyVisible = false
      sessionStorage.removeItem(SESSION_API_KEY)
      localStorage.removeItem(LOCAL_API_KEY)
      localStorage.removeItem(LOCAL_REMEMBER_KEY)
    },
  },
})
