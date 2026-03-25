<template>
  <div class="min-h-screen">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-5xl text-gray-900 mb-6">Trainer Card</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section class="lg:col-span-2 pokedex-panel p-6 md:p-8 border-2 border-red-200">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p class="text-sm font-black uppercase tracking-widest text-red-600">Entrenador</p>
              <p class="text-3xl font-black text-gray-900">{{ authStore.user?.displayName }}</p>
              <p class="text-sm text-gray-600">@{{ authStore.user?.username }}</p>
            </div>
            <span class="trainer-chip">Poke League Pass</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <article class="rounded-2xl border border-red-100 bg-red-50/80 p-4">
              <p class="text-xs font-black uppercase tracking-wider text-red-700">Correo</p>
              <p class="text-gray-900 font-bold break-all">{{ authStore.user?.email }}</p>
            </article>

            <article class="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
              <p class="text-xs font-black uppercase tracking-wider text-blue-700">UID de Amistad</p>
              <p class="text-xl font-black tracking-wider text-blue-900">{{ authStore.user?.uid }}</p>
            </article>
          </div>

          <div class="mt-6 rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-100 to-amber-100 p-4">
            <p class="font-black text-amber-900">Consejo de entrenador</p>
            <p class="text-sm text-amber-800 mt-1">
              Comparte tu UID con tus amigos para enviar retos y batallas en tiempo real.
            </p>
          </div>
        </section>

        <aside class="pokedex-panel p-6 border-2 border-blue-200">
          <h2 class="text-3xl text-gray-900 mb-4">Centro Poke</h2>
          <p class="text-sm text-gray-600 mb-4">
            Activa notificaciones para recibir alertas de amistad y resultados de batallas.
          </p>

          <button
            @click="enablePush"
            :disabled="pushLoading"
            class="pkmn-btn w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-xl transition disabled:opacity-60"
          >
            {{ pushLoading ? 'Activando...' : 'Activar notificaciones push' }}
          </button>

          <p v-if="pushMessage" class="text-sm mt-3 font-semibold" :class="pushError ? 'text-red-600' : 'text-green-700'">
            {{ pushMessage }}
          </p>

          <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p class="text-xs font-bold text-slate-500 uppercase">Estado</p>
            <p class="text-sm font-semibold text-slate-700 mt-1">Cuenta conectada y lista para jugar</p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { requestNotificationPermission, subscribeToPush } from '@/services/pushService'

const authStore = useAuthStore()

const pushLoading = ref(false)
const pushMessage = ref('')
const pushError = ref(false)

const enablePush = async () => {
  pushMessage.value = ''
  pushError.value = false
  pushLoading.value = true

  try {
    const permission = await requestNotificationPermission()

    if (permission !== 'granted') {
      pushError.value = true
      pushMessage.value = 'Necesitas aceptar notificaciones para continuar.'
      return
    }

    await subscribeToPush(authStore.token)
    pushMessage.value = 'Notificaciones activadas correctamente.'
  } catch (error) {
    pushError.value = true
    pushMessage.value = error?.response?.data?.error || error?.message || 'No se pudo activar push.'
  } finally {
    pushLoading.value = false
  }
}
</script>
