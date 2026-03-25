import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './authStore'
import notificationService from '@/services/notificationService'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const loading = ref(false)
  const error = ref('')

  const unreadCount = computed(() => {
    return notifications.value.filter((notification) => !notification.readAt).length
  })

  async function loadNotifications() {
    const authStore = useAuthStore()
    if (!authStore.token) {
      notifications.value = []
      return
    }

    loading.value = true
    error.value = ''

    try {
      const data = await notificationService.listNotifications(authStore.token)
      notifications.value = data.notifications || []
    } catch (err) {
      error.value = err?.response?.data?.error || 'No se pudieron cargar las notificaciones'
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(notificationId) {
    const authStore = useAuthStore()
    if (!authStore.token) return

    try {
      await notificationService.markNotificationAsRead(authStore.token, notificationId)
      const found = notifications.value.find((notification) => notification._id === notificationId)
      if (found && !found.readAt) {
        found.readAt = new Date().toISOString()
      }
    } catch (err) {
      error.value = err?.response?.data?.error || 'No se pudo marcar la notificacion como leida'
    }
  }

  function clearNotifications() {
    notifications.value = []
    error.value = ''
  }

  return {
    notifications,
    loading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
    clearNotifications,
  }
})
