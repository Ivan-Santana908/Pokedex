<template>
  <div class="min-h-screen">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 class="text-5xl text-gray-900">Trainer Friends</h1>
        <span class="trainer-chip">Link Room</span>
      </div>

      <div class="pokedex-panel p-6 border-2 border-blue-200 mb-8">
        <h2 class="text-4xl text-gray-900 mb-2">Agregar por UID</h2>
        <p class="text-sm text-gray-600 mb-4 font-semibold">
          Tu UID: <span class="font-black text-blue-700 tracking-wider">{{ authStore.user?.uid }}</span>
        </p>

        <div class="flex gap-2 flex-col sm:flex-row">
          <input
            v-model="newFriendUid"
            type="text"
            placeholder="Ejemplo: 9XK3P2QW"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 uppercase"
          />
          <button
            @click="sendRequest"
            :disabled="loadingRequest || !newFriendUid.trim()"
            class="pkmn-btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-2 px-6 rounded-xl transition disabled:opacity-60"
          >
            {{ loadingRequest ? 'Enviando...' : 'Enviar solicitud' }}
          </button>
        </div>
        <p v-if="message" class="text-sm mt-2 font-semibold" :class="errorMessage ? 'text-red-600' : 'text-green-700'">
          {{ message }}
        </p>
      </div>

      <div class="flex gap-3 mb-8 border-b-2 border-slate-200">
        <button
          @click="activeTab = 'friends'"
          :class="activeTab === 'friends' ? 'border-b-4 border-blue-600 text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-gray-800'"
          class="font-black py-2 px-4 transition rounded-t-xl"
        >
          Mis Amigos ({{ friendStore.friends.length }})
        </button>
        <button
          @click="activeTab = 'requests'"
          :class="activeTab === 'requests' ? 'border-b-4 border-blue-600 text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-gray-800'"
          class="font-black py-2 px-4 transition rounded-t-xl"
        >
          Solicitudes ({{ friendStore.getPendingRequests().length }})
        </button>
      </div>

      <div v-if="friendStore.loading" class="pokedex-panel p-8 text-center text-gray-600 font-semibold">
        Cargando amigos...
      </div>

      <div v-else-if="activeTab === 'friends'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="friend in friendStore.friends"
          :key="friend.id"
          class="pokedex-panel p-6 border-2 border-blue-100 hover:border-blue-300 transition"
        >
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-black">
              {{ friend.username.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h3 class="font-black text-lg text-gray-800">{{ friend.displayName || friend.username }}</h3>
              <p class="text-sm text-gray-600">@{{ friend.username }}</p>
              <p class="text-xs text-gray-500 font-semibold">UID: {{ friend.uid }}</p>
            </div>
          </div>

          <button
            @click="goToBattles"
            class="pkmn-btn w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black py-2 rounded-xl transition text-sm"
          >
            Retar a batalla
          </button>
        </div>

        <div v-if="friendStore.friends.length === 0" class="pokedex-panel p-8 text-center col-span-full border-2 border-slate-200">
          <h3 class="text-4xl text-gray-800 mb-2">Aun no tienes amigos</h3>
          <p class="text-gray-600">Comparte tu UID y envia solicitudes para empezar.</p>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="request in friendStore.getPendingRequests()"
          :key="request.id"
          class="pokedex-panel p-6 border-2 border-emerald-100"
        >
          <div class="flex justify-between gap-4 flex-col md:flex-row md:items-center">
            <div>
              <h3 class="font-black text-lg text-gray-800">{{ request.displayName || request.username }}</h3>
              <p class="text-sm text-gray-600">@{{ request.username }} · UID {{ request.uid }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ new Date(request.sentAt).toLocaleString() }}</p>
            </div>

            <div class="flex gap-2">
              <button
                @click="acceptRequest(request.id)"
                class="pkmn-btn bg-green-600 hover:bg-green-700 text-white font-black py-2 px-4 rounded-xl transition"
              >
                Aceptar
              </button>
              <button
                @click="rejectRequest(request.id)"
                class="pkmn-btn bg-red-600 hover:bg-red-700 text-white font-black py-2 px-4 rounded-xl transition"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>

        <div v-if="friendStore.getPendingRequests().length === 0" class="pokedex-panel p-8 text-center border-2 border-slate-200">
          <h3 class="text-4xl text-gray-800 mb-2">No hay solicitudes pendientes</h3>
          <p class="text-gray-600">Cuando te envien una solicitud aparecera aqui.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFriendStore } from '@/stores/friendStore'
import { useAuthStore } from '@/stores/authStore'

const friendStore = useFriendStore()
const authStore = useAuthStore()
const router = useRouter()

const activeTab = ref('friends')
const newFriendUid = ref('')
const message = ref('')
const errorMessage = ref(false)
const loadingRequest = ref(false)

const sendRequest = async () => {
  loadingRequest.value = true
  message.value = ''
  errorMessage.value = false

  try {
    await friendStore.sendFriendRequest(newFriendUid.value)
    newFriendUid.value = ''
    message.value = 'Solicitud enviada correctamente.'
  } catch (err) {
    errorMessage.value = true
    message.value = err?.response?.data?.error || 'No se pudo enviar la solicitud.'
  } finally {
    loadingRequest.value = false
  }
}

const acceptRequest = async (requestId) => {
  try {
    await friendStore.acceptFriendRequest(requestId)
    message.value = 'Solicitud aceptada.'
    errorMessage.value = false
  } catch (err) {
    errorMessage.value = true
    message.value = err?.response?.data?.error || 'No se pudo aceptar la solicitud.'
  }
}

const rejectRequest = async (requestId) => {
  try {
    await friendStore.rejectFriendRequest(requestId)
    message.value = 'Solicitud rechazada.'
    errorMessage.value = false
  } catch (err) {
    errorMessage.value = true
    message.value = err?.response?.data?.error || 'No se pudo rechazar la solicitud.'
  }
}

const goToBattles = () => {
  router.push('/battles')
}

onMounted(async () => {
  if (!authStore.isAuthenticated) return
  await friendStore.refreshAll()
})
</script>
