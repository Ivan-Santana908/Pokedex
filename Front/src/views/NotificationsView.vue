<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-4xl font-black text-gray-900">Notificaciones</h1>
        <button
          @click="notificationStore.loadNotifications"
          :disabled="notificationStore.loading"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-60"
        >
          {{ notificationStore.loading ? 'Actualizando...' : 'Actualizar' }}
        </button>
      </div>

      <div v-if="notificationStore.error" class="bg-red-100 text-red-700 border border-red-200 rounded-lg p-3 mb-4">
        {{ notificationStore.error }}
      </div>

      <div v-if="notificationStore.loading && notificationStore.notifications.length === 0" class="bg-white rounded-lg shadow p-6 text-gray-600">
        Cargando notificaciones...
      </div>

      <div v-else-if="notificationStore.notifications.length === 0" class="bg-white rounded-lg shadow p-6 text-gray-600">
        No tienes notificaciones por ahora.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="notification in notificationStore.notifications"
          :key="notification._id"
          class="bg-white rounded-lg shadow p-4 border"
          :class="notification.readAt ? 'border-gray-200' : 'border-blue-300'"
        >
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p class="font-bold text-gray-900">{{ notification.title }}</p>
              <p class="text-gray-700 mt-1">{{ notification.body }}</p>
              <p class="text-xs text-gray-500 mt-2">{{ new Date(notification.createdAt).toLocaleString() }}</p>
            </div>

            <button
              v-if="!notification.readAt"
              @click="notificationStore.markAsRead(notification._id)"
              class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded"
            >
              Marcar leida
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

onMounted(async () => {
  if (!authStore.isAuthenticated) return
  await notificationStore.loadNotifications()
})
</script>
