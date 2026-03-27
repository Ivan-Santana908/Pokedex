import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import authService from '@/services/authService'

const TOKEN_KEY = 'pokedexAuthToken'
const USER_KEY = 'pokedexAuthUser'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(null)
  const initializing = ref(false)
  const initialized = ref(false)
  const error = ref('')
  let initPromise = null

  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  function persistSession(nextToken, nextUser) {
    token.value = nextToken
    user.value = nextUser
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }

  function clearSession() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  async function initializeAuth() {
    if (initialized.value) return
    if (initPromise) {
      await initPromise
      return
    }

    initPromise = (async () => {
      initializing.value = true
      error.value = ''

      try {
        const savedUser = localStorage.getItem(USER_KEY)
        if (savedUser) {
          user.value = JSON.parse(savedUser)
        }

        if (!token.value) {
          initialized.value = true
          return
        }

        const response = await authService.me(token.value)
        user.value = response.user
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))
      } catch (err) {
        clearSession()
        error.value = err?.response?.data?.error || 'Session expired'
      } finally {
        initialized.value = true
        initializing.value = false
      }
    })()

    await initPromise
    initPromise = null
  }

  async function registerUser(payload) {
    error.value = ''
    const response = await authService.register(payload)
    persistSession(response.token, response.user)

    return response.user
  }

  async function loginUser(payload) {
    error.value = ''
    const response = await authService.login(payload)
    persistSession(response.token, response.user)

    return response.user
  }

  function logout() {
    clearSession()
    error.value = ''
  }

  return {
    token,
    user,
    initializing,
    initialized,
    error,
    isAuthenticated,
    initializeAuth,
    registerUser,
    loginUser,
    logout,
  }
})
