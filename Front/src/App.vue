<script setup>
import { onMounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { ensurePushEnabled } from '@/services/pushService'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const REQUEST_PUSH_AFTER_AUTH_KEY = 'requestPushAfterAuth'

onMounted(async () => {
  await authStore.initializeAuth()
  if (authStore.isAuthenticated) {
    await notificationStore.loadNotifications()

    // Solicitar permiso solo despues de login/registro exitoso.
    // Evita popup antes de entrar a la app.
    const shouldRequestPush = sessionStorage.getItem(REQUEST_PUSH_AFTER_AUTH_KEY) === '1'
    if (shouldRequestPush) {
      try {
        await ensurePushEnabled(authStore.token)
      } catch (pushError) {
        console.warn('Push enable after auth skipped:', pushError?.message || pushError)
      } finally {
        sessionStorage.removeItem(REQUEST_PUSH_AFTER_AUTH_KEY)
      }
    }
  }
})
</script>

<template>
  <div class="min-h-screen pokemon-shell">
    <Navbar />
    <main class="pb-12">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
</style>

