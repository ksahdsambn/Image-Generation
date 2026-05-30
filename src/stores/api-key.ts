import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SESSION_KEY = 'gpt_image_2_api_key'
const LOCAL_KEY = 'gpt_image_2_api_key_remember'
const REMEMBER_PREF_KEY = 'gpt_image_2_remember_key'

export const useApiKeyStore = defineStore('apiKey', () => {
  const apiKey = ref('')
  const visible = ref(false)
  const rememberKey = ref(false)

  function _loadFromStorage() {
    const savedPref = localStorage.getItem(REMEMBER_PREF_KEY)
    if (savedPref === 'true') {
      rememberKey.value = true
      const saved = localStorage.getItem(LOCAL_KEY)
      if (saved) {
        apiKey.value = saved
        return
      }
    }
    const sessionSaved = sessionStorage.getItem(SESSION_KEY)
    if (sessionSaved) {
      apiKey.value = sessionSaved
    }
  }

  function _persist() {
    if (apiKey.value) {
      sessionStorage.setItem(SESSION_KEY, apiKey.value)
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }

    if (rememberKey.value && apiKey.value) {
      localStorage.setItem(LOCAL_KEY, apiKey.value)
    } else {
      localStorage.removeItem(LOCAL_KEY)
    }

    if (rememberKey.value) {
      localStorage.setItem(REMEMBER_PREF_KEY, 'true')
    } else {
      localStorage.removeItem(REMEMBER_PREF_KEY)
    }
  }

  const hasKey = computed(() => apiKey.value.trim().length > 0)

  function setApiKey(key: string) {
    apiKey.value = key
    _persist()
  }

  function clearApiKey() {
    apiKey.value = ''
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(LOCAL_KEY)
    localStorage.removeItem(REMEMBER_PREF_KEY)
    rememberKey.value = false
  }

  function toggleVisible() {
    visible.value = !visible.value
  }

  function setRememberKey(value: boolean) {
    rememberKey.value = value
    _persist()
  }

  function getMaskedKey(): string {
    if (!apiKey.value) return ''
    if (apiKey.value.length <= 8) return '****'
    return apiKey.value.slice(0, 4) + '****' + apiKey.value.slice(-4)
  }

  _loadFromStorage()

  return {
    apiKey,
    visible,
    rememberKey,
    hasKey,
    setApiKey,
    clearApiKey,
    toggleVisible,
    setRememberKey,
    getMaskedKey,
  }
})
