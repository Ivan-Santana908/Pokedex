<template>
  <div class="min-h-screen bg-gradient-to-br from-red-100 via-orange-100 to-amber-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
      <h1 class="text-3xl font-black text-gray-900 mb-2">Iniciar Sesion</h1>
      <p class="text-gray-600 mb-6">Accede para usar amigos, equipos y batallas online.</p>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Correo o usuario</label>
          <input
            v-model="emailOrUsername"
            type="text"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-red-500"
            placeholder="ash@kanto.com o ash"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Contrasena</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-red-500"
            placeholder="********"
          />
        </div>

        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

        <button
          :disabled="loading"
          class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="text-sm text-gray-600 mt-6">
        No tienes cuenta?
        <router-link to="/register" class="font-bold text-red-700 hover:text-red-800">Crear cuenta</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ensurePushEnabled } from '@/services/pushService'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const emailOrUsername = ref('')
const password = ref('')
const loading = ref(false)
const formError = ref('')

const submit = async () => {
  formError.value = ''
  loading.value = true

  try {
    await authStore.loginUser({
      emailOrUsername: emailOrUsername.value.trim(),
      password: password.value,
    })

    try {
      await ensurePushEnabled(authStore.token)
    } catch (pushError) {
      console.warn('Push enable after login skipped:', pushError?.message || pushError)
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/pokemon'
    router.push(redirect)
  } catch (err) {
    formError.value = err?.response?.data?.error || 'No se pudo iniciar sesion'
  } finally {
    loading.value = false
  }
}
</script>
