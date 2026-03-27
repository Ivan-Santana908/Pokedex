<script setup>
import { onMounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { ensurePushEnabled } from '@/services/pushService'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

onMounted(async () => {
  await authStore.initializeAuth()
  if (authStore.isAuthenticated) {
    await notificationStore.loadNotifications()

    try {
      await ensurePushEnabled(authStore.token)
    } catch (error) {
      console.warn('Push auto-enable skipped:', error?.message || error)
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

