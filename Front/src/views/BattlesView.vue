<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 class="text-5xl text-gray-900">Battle Network</h1>
        <span class="trainer-chip">Ranked Arena</span>
      </div>

      <div class="pokedex-panel p-6 border-2 border-red-200 mb-8">
        <h2 class="text-4xl text-gray-900 mb-4">Retar a un amigo</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select v-model="selectedFriendUid" class="px-4 py-2 border rounded-xl bg-white">
            <option value="">Selecciona amigo</option>
            <option v-for="friend in friendStore.friends" :key="friend.uid" :value="friend.uid">
              {{ friend.displayName || friend.username }} ({{ friend.uid }})
            </option>
          </select>

          <select v-model="selectedTeamId" class="px-4 py-2 border rounded-xl bg-white">
            <option value="">Selecciona tu equipo</option>
            <option v-if="teamStore.teams.length === 0" disabled value="">No hay equipos disponibles</option>
            <option v-for="team in teamStore.teams" :key="team.id" :value="team.id">
              {{ team.name }} ({{ team.pokemon.length }} Pokemon)
            </option>
          </select>

          <button
            @click="sendBattleRequest"
            :disabled="!selectedFriendUid || !selectedTeamId || loadingAction"
            class="pkmn-btn bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-2 rounded-xl transition disabled:opacity-60"
          >
            {{ loadingAction ? 'Enviando...' : 'Enviar desafio' }}
          </button>
        </div>

        <p v-if="message" class="text-sm mt-3 font-semibold" :class="messageError ? 'text-red-600' : 'text-green-700'">
          {{ message }}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div class="pokedex-panel p-6 border-2 border-emerald-200">
          <h2 class="text-4xl text-gray-900 mb-4">Solicitudes recibidas</h2>

          <div v-if="incomingBattles.length === 0" class="text-sm text-gray-600 font-semibold">No tienes solicitudes pendientes.</div>

          <div v-for="battle in incomingBattles" :key="battle._id" class="border border-emerald-200 rounded-xl p-3 mb-3 bg-emerald-50/40">
            <p class="font-semibold text-gray-800">
              {{ battle.challenger.displayName || battle.challenger.username }} te desafio
            </p>
            <p class="text-xs text-gray-500 mb-2">{{ new Date(battle.createdAt).toLocaleString() }}</p>

            <select v-model="responseTeamByBattle[battle._id]" class="w-full px-3 py-2 border rounded-xl mb-2 bg-white">
              <option value="">Elige tu equipo para aceptar</option>
              <option v-if="teamStore.teams.length === 0" disabled value="">No hay equipos disponibles</option>
              <option v-for="team in teamStore.teams" :key="team.id" :value="team.id">{{ team.name }}</option>
            </select>

            <div class="flex gap-2">
              <button
                @click="respondBattleRequest(battle._id, 'accept')"
                :disabled="!responseTeamByBattle[battle._id]"
                class="pkmn-btn flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-2 rounded-xl disabled:opacity-60"
              >
                Aceptar
              </button>
              <button
                @click="respondBattleRequest(battle._id, 'reject')"
                class="pkmn-btn flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-2 rounded-xl"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>

        <div class="pokedex-panel p-6 border-2 border-blue-200">
          <h2 class="text-4xl text-gray-900 mb-4">Solicitudes enviadas</h2>

          <div v-if="outgoingBattles.length === 0" class="text-sm text-gray-600 font-semibold">No has enviado solicitudes pendientes.</div>

          <div v-for="battle in outgoingBattles" :key="battle._id" class="border border-blue-200 rounded-xl p-3 mb-3 bg-blue-50/40">
            <p class="font-semibold text-gray-800">
              Desafiaste a {{ battle.opponent.displayName || battle.opponent.username }}
            </p>
            <p class="text-xs text-gray-500">{{ new Date(battle.createdAt).toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <div class="pokedex-panel p-6 border-2 border-yellow-200 mb-8">
        <h2 class="text-4xl text-gray-900 mb-4">Batallas aceptadas</h2>

        <div v-if="acceptedBattles.length === 0" class="text-sm text-gray-600 font-semibold">No hay batallas aceptadas listas para jugar.</div>

        <div v-for="battle in acceptedBattles" :key="battle._id" class="border border-yellow-200 rounded-xl p-3 mb-3 bg-yellow-50/40">
          <p class="font-semibold text-gray-800">
            {{ battle.challenger?.username }} vs {{ battle.opponent?.username }}
          </p>
          <p class="text-xs text-gray-500 mb-2">Estado: {{ battle.status }}</p>
          <div class="flex gap-2 flex-wrap">
            <button
              @click="openLiveBattle(battle._id)"
              class="pkmn-btn bg-purple-600 hover:bg-purple-700 text-white font-black py-2 px-4 rounded-xl"
            >
              Jugar por turnos
            </button>
            <button
              @click="simulate(battle._id)"
              class="pkmn-btn bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 px-4 rounded-xl"
            >
              Simular auto
            </button>
          </div>
        </div>
      </div>

      <div v-if="liveBattle" class="pokedex-panel p-6 border-2 border-fuchsia-200 mb-8">
        <h2 class="text-4xl text-gray-900 mb-2">Combate en vivo</h2>
        <p class="text-sm text-gray-700 mb-4">
          Turno de: <strong>{{ liveBattle.battleState?.turnUid }}</strong>
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="border rounded-xl p-3 bg-white">
            <p class="font-black text-gray-900 mb-1">Tu Pokemon activo</p>
            <p class="text-sm text-gray-700 mb-1">{{ myActivePokemon ? myActivePokemon.pokemonName : '-' }}</p>
            <p class="text-xs text-gray-600 mb-2">HP {{ myActivePokemon?.currentHp || 0 }}/{{ myActivePokemon?.maxHp || 0 }}</p>
            <div class="w-full h-3 bg-gray-200 rounded overflow-hidden">
              <div class="h-3 bg-green-500" :style="{ width: `${hpPercent(myActivePokemon)}%` }"></div>
            </div>
          </div>

          <div class="border rounded-xl p-3 bg-white">
            <p class="font-black text-gray-900 mb-1">Pokemon rival activo</p>
            <p class="text-sm text-gray-700 mb-1">{{ foeActivePokemon ? foeActivePokemon.pokemonName : '-' }}</p>
            <p class="text-xs text-gray-600 mb-2">HP {{ foeActivePokemon?.currentHp || 0 }}/{{ foeActivePokemon?.maxHp || 0 }}</p>
            <div class="w-full h-3 bg-gray-200 rounded overflow-hidden">
              <div class="h-3 bg-red-500" :style="{ width: `${hpPercent(foeActivePokemon)}%` }"></div>
            </div>
          </div>
        </div>

        <div v-if="isLiveFinished" class="mb-3 text-green-700 font-semibold">
          {{ liveBattle.battleState?.summary || 'La batalla ha terminado.' }}
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <button
            v-for="move in (myActivePokemon?.moves || [])"
            :key="move.name"
            @click="playMove(move.name)"
            :disabled="!isMyTurn || isLiveFinished || loadingAction"
            class="pkmn-btn bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-xl disabled:opacity-50"
          >
            {{ move.name }}
          </button>
        </div>

        <div class="max-h-72 overflow-y-auto border rounded-xl p-3 bg-gray-50">
          <p v-for="(turn, idx) in (liveBattle.battleState?.log || []).slice(-20)" :key="idx" class="text-sm text-gray-700 mb-1">
            - {{ turn.message }} ({{ turn.damage }} dano)
          </p>
        </div>
      </div>

      <div v-if="lastBattleResult" class="pokedex-panel p-6 border-2 border-slate-200">
        <h2 class="text-4xl text-gray-900 mb-2">Resultado mas reciente</h2>
        <p class="text-gray-700 mb-3">{{ lastBattleResult.summary }}</p>
        <div class="max-h-72 overflow-y-auto border rounded-xl p-3 bg-gray-50">
          <p v-for="(turn, idx) in (lastBattleResult.turns || []).slice(0, 30)" :key="idx" class="text-sm text-gray-700 mb-1">
            - {{ turn.message }} ({{ turn.damage }} dano)
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useTeamStore } from '@/stores/teamStore'
import { useFriendStore } from '@/stores/friendStore'
import battleService from '@/services/battleService'

const authStore = useAuthStore()
const teamStore = useTeamStore()
const friendStore = useFriendStore()

const selectedFriendUid = ref('')
const selectedTeamId = ref('')
const loadingAction = ref(false)
const message = ref('')
const messageError = ref(false)

const incomingBattles = ref([])
const outgoingBattles = ref([])
const battleHistory = ref([])
const responseTeamByBattle = ref({})
const lastBattleResult = ref(null)
const liveBattleId = ref('')
const liveBattle = ref(null)
let livePoller = null

const acceptedBattles = computed(() => battleHistory.value.filter((battle) => battle.status === 'accepted'))
const myUid = computed(() => authStore.user?.uid || '')

const mySide = computed(() => {
  const state = liveBattle.value?.battleState
  if (!state) return null
  if (state.challenger?.uid === myUid.value) return state.challenger
  if (state.opponent?.uid === myUid.value) return state.opponent
  return null
})

const foeSide = computed(() => {
  const state = liveBattle.value?.battleState
  if (!state) return null
  if (state.challenger?.uid === myUid.value) return state.opponent
  if (state.opponent?.uid === myUid.value) return state.challenger
  return null
})

const myActivePokemon = computed(() => {
  const side = mySide.value
  if (!side) return null
  return side.team?.[side.activeIndex] || null
})

const foeActivePokemon = computed(() => {
  const side = foeSide.value
  if (!side) return null
  return side.team?.[side.activeIndex] || null
})

const isMyTurn = computed(() => {
  const state = liveBattle.value?.battleState
  return Boolean(state && state.turnUid === myUid.value)
})

const isLiveFinished = computed(() => liveBattle.value?.battleState?.phase === 'finished')

function hpPercent(pokemon) {
  if (!pokemon || !pokemon.maxHp) return 0
  return Math.max(0, Math.min(100, Math.round((pokemon.currentHp / pokemon.maxHp) * 100)))
}

async function loadBattleData() {
  if (!authStore.token) return

  const [requestData, historyData] = await Promise.all([
    battleService.listRequests(authStore.token),
    battleService.listHistory(authStore.token),
  ])

  incomingBattles.value = requestData.incoming || []
  outgoingBattles.value = requestData.outgoing || []
  battleHistory.value = historyData.battles || []
}

async function sendBattleRequest() {
  if (!selectedFriendUid.value || !selectedTeamId.value) return

  loadingAction.value = true
  message.value = ''
  messageError.value = false

  try {
    await battleService.sendRequest(authStore.token, selectedFriendUid.value, selectedTeamId.value)
    message.value = 'Solicitud de batalla enviada.'
    await loadBattleData()
  } catch (err) {
    messageError.value = true
    message.value = err?.response?.data?.error || 'No se pudo enviar la solicitud de batalla.'
  } finally {
    loadingAction.value = false
  }
}

async function respondBattleRequest(battleId, action) {
  loadingAction.value = true
  message.value = ''
  messageError.value = false

  try {
    const opponentTeamId = action === 'accept' ? responseTeamByBattle.value[battleId] : undefined
    await battleService.respondRequest(authStore.token, battleId, action, opponentTeamId)
    message.value = action === 'accept' ? 'Solicitud aceptada.' : 'Solicitud rechazada.'
    await loadBattleData()
  } catch (err) {
    messageError.value = true
    message.value = err?.response?.data?.error || 'No se pudo responder la solicitud.'
  } finally {
    loadingAction.value = false
  }
}

async function simulate(battleId) {
  loadingAction.value = true
  message.value = ''
  messageError.value = false

  try {
    const data = await battleService.simulateBattle(authStore.token, battleId)
    lastBattleResult.value = data.battle
    message.value = 'Batalla simulada correctamente.'
    await loadBattleData()
  } catch (err) {
    messageError.value = true
    message.value = err?.response?.data?.error || 'No se pudo simular la batalla.'
  } finally {
    loadingAction.value = false
  }
}

async function refreshLiveBattle() {
  if (!authStore.token || !liveBattleId.value) return
  const data = await battleService.getBattleState(authStore.token, liveBattleId.value)
  liveBattle.value = data.battle
}

function stopLivePolling() {
  if (livePoller) {
    clearInterval(livePoller)
    livePoller = null
  }
}

function startLivePolling() {
  stopLivePolling()
  livePoller = setInterval(async () => {
    try {
      await refreshLiveBattle()
      if (isLiveFinished.value) stopLivePolling()
    } catch {
      // Ignore transient polling errors.
    }
  }, 3000)
}

async function openLiveBattle(battleId) {
  loadingAction.value = true
  message.value = ''
  messageError.value = false

  try {
    liveBattleId.value = battleId
    await refreshLiveBattle()
    startLivePolling()
    message.value = 'Combate en vivo cargado.'
  } catch (err) {
    messageError.value = true
    message.value = err?.response?.data?.error || 'No se pudo abrir la batalla en vivo.'
  } finally {
    loadingAction.value = false
  }
}

async function playMove(moveName) {
  if (!liveBattleId.value || !isMyTurn.value || isLiveFinished.value) return

  loadingAction.value = true
  message.value = ''
  messageError.value = false

  try {
    const data = await battleService.playTurn(authStore.token, liveBattleId.value, moveName)
    liveBattle.value = data.battle
    if (isLiveFinished.value) {
      message.value = liveBattle.value?.battleState?.summary || 'La batalla termino.'
      await loadBattleData()
      stopLivePolling()
    }
  } catch (err) {
    messageError.value = true
    message.value = err?.response?.data?.error || 'No se pudo jugar el turno.'
  } finally {
    loadingAction.value = false
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) return
  await Promise.all([teamStore.loadTeams(), friendStore.refreshAll()])
  await loadBattleData()
})

onUnmounted(() => {
  stopLivePolling()
})
</script>
