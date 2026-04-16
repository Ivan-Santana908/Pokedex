<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 flex items-center justify-center p-4">
    <div class="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8">
      <h1 class="text-3xl font-black text-gray-900 mb-2">Crear Cuenta</h1>
      <p class="text-gray-600 mb-6">Tu UID se genera automaticamente para agregar amigos.</p>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Nombre visible</label>
          <input
            v-model="displayName"
            type="text"
            required
            minlength="2"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-red-500"
            placeholder="Ash Ketchum"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Usuario</label>
          <input
            v-model="username"
            type="text"
            required
            minlength="3"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-red-500"
            placeholder="ash"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Correo</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-red-500"
            placeholder="ash@kanto.com"
          />
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Contrasena</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-red-500"
            placeholder="Minimo 8 caracteres"
          />
        </div>

        <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

        <button
          :disabled="loading"
          class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {{ loading ? 'Creando cuenta...' : 'Registrarme' }}
        </button>
      </form>

      <p class="text-sm text-gray-600 mt-6">
        Ya tienes cuenta?
        <router-link to="/login" class="font-bold text-red-700 hover:text-red-800">Iniciar sesion</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const REQUEST_PUSH_AFTER_AUTH_KEY = 'requestPushAfterAuth'

const displayName = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const formError = ref('')

const submit = async () => {
  formError.value = ''
  loading.value = true

  try {
    await authStore.registerUser({
      displayName: displayName.value.trim(),
      username: username.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })

    sessionStorage.setItem(REQUEST_PUSH_AFTER_AUTH_KEY, '1')

    router.push('/profile')
  } catch (err) {
    formError.value = err?.response?.data?.error || 'No se pudo crear la cuenta'
  } finally {
    loading.value = false
  }
}
</script>
