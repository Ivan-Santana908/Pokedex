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
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-4xl text-gray-900">Combate en vivo 🎮</h2>
          <button @click="closeLiveBattle" class="pkmn-btn bg-red-600 hover:bg-red-700 text-white font-black py-2 px-4 rounded-xl">
            ✕ Cerrar
          </button>
        </div>

        <!-- Battle Arena -->
        <div class="bg-gradient-to-b from-sky-300 to-sky-100 rounded-xl p-6 mb-6 border-4 border-sky-400 shadow-lg">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <!-- Foe Pokemon -->
            <div class="text-center">
              <p class="text-sm font-bold text-gray-700 mb-2">{{ foeSide?.username || 'Rival' }}</p>
              <img
                :src="getPokemonImage(foeActivePokemon?.pokemonId)"
                :alt="foeActivePokemon?.pokemonName"
                :data-pokemon-id="foeActivePokemon?.pokemonId || ''"
                @error="handleBattleImageError"
                class="w-48 h-48 mx-auto object-contain filter drop-shadow-lg transform scale-x-[-1]"
              />
              <p class="font-bold text-gray-900 mt-2 capitalize">{{ foeActivePokemon?.pokemonName }}</p>
              <p class="text-xs text-gray-600 mb-1">Nivel {{ foeActivePokemon?.level || 50 }}</p>
              
              <!-- HP Bar Rival -->
              <div class="bg-gray-200 rounded-full h-6 border-2 border-gray-400 mb-2 overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                  :style="{ width: `${hpPercent(foeActivePokemon)}%` }"
                />
              </div>
              <p class="text-xs font-semibold text-gray-700">
                HP: {{ foeActivePokemon?.currentHp || 0 }}/{{ foeActivePokemon?.maxHp || 0 }}
              </p>
            </div>

            <!-- My Pokemon -->
            <div class="text-center">
              <p class="text-sm font-bold text-gray-700 mb-2">{{ mySide?.username || 'Tú' }}</p>
              <img
                :src="getPokemonImage(myActivePokemon?.pokemonId)"
                :alt="myActivePokemon?.pokemonName"
                :data-pokemon-id="myActivePokemon?.pokemonId || ''"
                @error="handleBattleImageError"
                class="w-48 h-48 mx-auto object-contain filter drop-shadow-lg"
              />
              <p class="font-bold text-gray-900 mt-2 capitalize">{{ myActivePokemon?.pokemonName }}</p>
              <p class="text-xs text-gray-600 mb-1">Nivel {{ myActivePokemon?.level || 50 }}</p>
              
              <!-- HP Bar Player -->
              <div class="bg-gray-200 rounded-full h-6 border-2 border-gray-400 mb-2 overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                  :style="{ width: `${hpPercent(myActivePokemon)}%` }"
                />
              </div>
              <p class="text-xs font-semibold text-gray-700">
                HP: {{ myActivePokemon?.currentHp || 0 }}/{{ myActivePokemon?.maxHp || 0 }}
              </p>
            </div>
          </div>
        </div>

        <!-- Turn indicator -->
        <div class="text-center mb-4 p-3 rounded-xl bg-yellow-100 border-2 border-yellow-400">
          <p v-if="isLiveFinished" class="text-lg font-bold text-green-700">
            ✓ {{ liveBattle.battleState?.summary || 'Batalla finalizada' }}
          </p>
          <p v-else class="text-lg font-bold" :class="isMyTurn ? 'text-green-700' : 'text-red-700'">
            {{ isMyTurn ? '👉 Tu turno - Elige un ataque' : '⏳ Espera el turno del rival...' }}
          </p>
        </div>

        <!-- Move buttons -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <button
            v-for="move in (myActivePokemon?.moves || [])"
            :key="move.name"
            @click="playMove(move.name)"
            :disabled="!isMyTurn || isLiveFinished || loadingAction"
            class="pkmn-btn bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed uppercase text-sm"
          >
            {{ loadingAction ? '...' : move.name }}
          </button>
        </div>

        <!-- Battle Log -->
        <div class="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
          <h3 class="font-bold text-gray-900 mb-3 text-sm uppercase">Registro de batalla</h3>
          <div class="max-h-48 overflow-y-auto space-y-1 bg-white p-3 rounded border border-gray-300">
            <p v-if="!liveBattle.battleState?.log || liveBattle.battleState.log.length === 0" class="text-xs text-gray-500 italic">
              Batalla iniciada...
            </p>
            <p 
              v-for="turn in (liveBattle.battleState?.log || []).slice(-20)" 
              :key="turn.logId || turn.timestamp || turn.message" 
              class="text-xs text-gray-700 font-semibold border-l-4 border-purple-400 pl-2"
            >
              <span class="text-purple-600">→</span> {{ turn.message }}
              <span v-if="turn.damage && turn.damage > 0" class="text-red-600 font-bold">(-{{ turn.damage }} HP)</span>
            </p>
          </div>
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
import battleSocketService from '@/services/battleSocketService'
import { pokemonService } from '@/services/pokemonService'

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
const pokemonDetails = ref({}) // Guardar detalles con imágenes
let requestPoller = null // Polling de solicitudes de batalla

const acceptedBattles = computed(() => battleHistory.value.filter((battle) => battle.status === 'accepted'))
const myUid = computed(() => authStore.user?.uid || '')

function normalizeUid(value) {
  return String(value || '').trim().toLowerCase()
}

const mySide = computed(() => {
  const state = liveBattle.value?.battleState
  if (!state) return null
  const myUidStr = normalizeUid(myUid.value)
  const challengerUid = normalizeUid(state.challenger?.uid)
  const opponentUid = normalizeUid(state.opponent?.uid)
  
  if (myUidStr && challengerUid && myUidStr === challengerUid) return state.challenger
  if (myUidStr && opponentUid && myUidStr === opponentUid) return state.opponent
  return null
})

const foeSide = computed(() => {
  const state = liveBattle.value?.battleState
  if (!state) return null
  const myUidStr = normalizeUid(myUid.value)
  const challengerUid = normalizeUid(state.challenger?.uid)
  const opponentUid = normalizeUid(state.opponent?.uid)
  
  if (myUidStr && challengerUid && myUidStr === challengerUid) return state.opponent
  if (myUidStr && opponentUid && myUidStr === opponentUid) return state.challenger
  return null
})

const myActivePokemon = computed(() => {
  const side = mySide.value
  if (!side) return null
  const pokemon = side.team?.[side.activeIndex] || null
  if (!pokemon) return null
  return { ...pokemon, details: pokemonDetails.value[pokemon.pokemonId] }
})

const foeActivePokemon = computed(() => {
  const side = foeSide.value
  if (!side) return null
  const pokemon = side.team?.[side.activeIndex] || null
  if (!pokemon) return null
  return { ...pokemon, details: pokemonDetails.value[pokemon.pokemonId] }
})

const isMyTurn = computed(() => {
  const state = liveBattle.value?.battleState
  const myUidStr = normalizeUid(myUid.value)
  const turnUidStr = normalizeUid(state?.turnUid)
  const isMy = myUidStr && turnUidStr && myUidStr === turnUidStr
  
  // Log para debug
  if (state && !isMy) {
    console.log('🔄 Turno actual:', turnUidStr, 'Mi UID:', myUidStr, 'Es mi turno:', isMy)
  }
  
  return Boolean(isMy)
})

const isLiveFinished = computed(() => liveBattle.value?.battleState?.phase === 'finished')

function hpPercent(pokemon) {
  if (!pokemon || !pokemon.maxHp) return 0
  return Math.max(0, Math.min(100, Math.round((pokemon.currentHp / pokemon.maxHp) * 100)))
}

function getPokemonImage(pokemonId) {
  const id = Number(pokemonId || 0)
  const details = pokemonDetails.value[pokemonId]
  const artwork = details?.sprites?.other?.['official-artwork']?.front_default
  const front = details?.sprites?.front_default

  if (artwork) return artwork
  if (front) return front
  if (id > 0) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
  }
  return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'
}

function handleBattleImageError(event) {
  const el = event?.target
  const id = Number(el?.dataset?.pokemonId || 0)
  if (!el) return

  if (id > 0) {
    el.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
    return
  }

  el.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'
}

function getPokemonType(pokemonId) {
  const details = pokemonDetails.value[pokemonId]
  return details?.types?.[0]?.type?.name || 'normal'
}

function getTypeColor(type) {
  const typeColors = {
    normal: 'bg-gray-400', fire: 'bg-red-500', water: 'bg-blue-500',
    grass: 'bg-green-500', electric: 'bg-yellow-400', ice: 'bg-cyan-300',
    fighting: 'bg-orange-700', poison: 'bg-purple-500', ground: 'bg-yellow-600',
    flying: 'bg-indigo-300', psychic: 'bg-pink-500', bug: 'bg-lime-500',
    rock: 'bg-gray-600', ghost: 'bg-purple-700', dragon: 'bg-indigo-600',
    dark: 'bg-gray-800', steel: 'bg-gray-500', fairy: 'bg-pink-300'
  }
  return typeColors[type] || 'bg-gray-400'
}

async function loadPokemonDetails(pokemonIds) {
  try {
    const ids = [...new Set(pokemonIds)].filter(id => !pokemonDetails.value[id])
    if (ids.length === 0) return
    
    const details = await pokemonService.getPokemonDetailsMultiple(ids)
    details.forEach(detail => {
      if (detail?.id) {
        pokemonDetails.value[detail.id] = detail
      }
    })
  } catch (err) {
    console.error('Error loading pokemon details:', err)
  }
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
  try {
    const data = await battleService.getBattleState(authStore.token, liveBattleId.value)
    
    // Normalizar UIDs a strings limpios
    if (data.battle?.battleState) {
      data.battle.battleState.turnUid = normalizeUid(data.battle.battleState.turnUid)
      if (data.battle.battleState.challenger) {
        data.battle.battleState.challenger.uid = normalizeUid(data.battle.battleState.challenger.uid)
      }
      if (data.battle.battleState.opponent) {
        data.battle.battleState.opponent.uid = normalizeUid(data.battle.battleState.opponent.uid)
      }
    }
    
    liveBattle.value = data.battle

    // Cargar detalles de pokémon cuando sea necesario
    const allPokemonIds = []
    data.battle?.battleState?.challenger?.team?.forEach(p => allPokemonIds.push(p.pokemonId))
    data.battle?.battleState?.opponent?.team?.forEach(p => allPokemonIds.push(p.pokemonId))
    await loadPokemonDetails(allPokemonIds)
  } catch (err) {
    console.error('Error refreshing battle:', err)
  }
}

function setupWebSocket() {
  battleSocketService.connect()

  // Escuchar actualizaciones de turno en tiempo real
  battleSocketService.onTurnUpdate((turnData) => {
    if (liveBattle.value?.battleState) {
      liveBattle.value.battleState.log = liveBattle.value.battleState.log || []
      // Asegurar que tenga timestamp para keys únicas
      const turn = {
        ...turnData,
        timestamp: Date.now(),
        logId: `turn-${Date.now()}-${Math.random()}`
      }
      liveBattle.value.battleState.log.push(turn)
    }
  })

  // Escuchar cambios de estado en tiempo real - MERGE, no reemplazar
  battleSocketService.onStateChanged((newState) => {
    if (liveBattle.value && newState) {
      // Hacer merge del estado en lugar de reemplazar todo (evita scroll)
      if (liveBattle.value.battleState) {
        // Copiar propiedades importantes sin perder el componente
        liveBattle.value.battleState.turnUid = newState.turnUid
        liveBattle.value.battleState.phase = newState.phase
        liveBattle.value.battleState.turnCount = newState.turnCount
        liveBattle.value.battleState.summary = newState.summary
        
        // Actualizar HP de pokémon sin re-crear el array
        if (newState.challenger && liveBattle.value.battleState.challenger) {
          if (newState.challenger.team && liveBattle.value.battleState.challenger.team) {
            newState.challenger.team.forEach((pokemon, idx) => {
              if (liveBattle.value.battleState.challenger.team[idx]) {
                liveBattle.value.battleState.challenger.team[idx].currentHp = pokemon.currentHp
                liveBattle.value.battleState.challenger.team[idx].fainted = pokemon.fainted
              }
            })
          }
          liveBattle.value.battleState.challenger.activeIndex = newState.challenger.activeIndex
        }
        
        if (newState.opponent && liveBattle.value.battleState.opponent) {
          if (newState.opponent.team && liveBattle.value.battleState.opponent.team) {
            newState.opponent.team.forEach((pokemon, idx) => {
              if (liveBattle.value.battleState.opponent.team[idx]) {
                liveBattle.value.battleState.opponent.team[idx].currentHp = pokemon.currentHp
                liveBattle.value.battleState.opponent.team[idx].fainted = pokemon.fainted
              }
            })
          }
          liveBattle.value.battleState.opponent.activeIndex = newState.opponent.activeIndex
        }
      }
    }
  })

  // Escuchar nuevas solicitudes de batalla
  battleSocketService.onNewRequest(() => {
    loadBattleData()
  })
}

function teardownWebSocket() {
  battleSocketService.offTurnUpdate()
  battleSocketService.offStateChanged()
  battleSocketService.offNewRequest()
  battleSocketService.disconnect()
}

async function openLiveBattle(battleId) {
  loadingAction.value = true
  message.value = ''
  messageError.value = false

  try {
    liveBattleId.value = battleId
    await refreshLiveBattle()
    setupWebSocket()
    battleSocketService.joinBattle(battleId, myUid.value)
    
    message.value = 'Combate en vivo cargado. WebSocket activo.'
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
    
    // Actualizar estado desde respuesta del servidor (que ya incluye el turno en el log)
    if (data.battle?.battleState) {
      const newState = data.battle.battleState
      
      // Asegurar que turnUid es string limpio
      if (newState.turnUid) {
        newState.turnUid = normalizeUid(newState.turnUid)
      }
      
      // Hacer merge cuidadoso del estado
      liveBattle.value.battleState = {
        ...liveBattle.value.battleState,
        phase: newState.phase,
        turnUid: newState.turnUid,
        turnCount: newState.turnCount,
        summary: newState.summary,
        log: Array.isArray(newState.log) ? newState.log : [],
        challenger: {
          ...newState.challenger,
          uid: normalizeUid(newState.challenger?.uid),
        },
        opponent: {
          ...newState.opponent,
          uid: normalizeUid(newState.opponent?.uid),
        },
      }
      
      // Asegurar que cada turno en el log tiene metadata
      if (Array.isArray(liveBattle.value.battleState.log)) {
        liveBattle.value.battleState.log.forEach((turn, idx) => {
          if (!turn.logId) {
            turn.logId = `turn-${Date.now()}-${idx}`
            turn.timestamp = Date.now()
          }
        })
      }
      
      console.log('✅ Estado actualizado. Nuevo turnUid:', newState.turnUid, 'Mi UID:', myUid.value)
    }

    if (isLiveFinished.value) {
      message.value = liveBattle.value?.battleState?.summary || 'La batalla termino.'
      await loadBattleData()
      teardownWebSocket()
    }
  } catch (err) {
    messageError.value = true
    message.value = err?.response?.data?.error || 'No se pudo jugar el turno.'
  } finally {
    loadingAction.value = false
  }
}

function closeLiveBattle() {
  liveBattleId.value = ''
  liveBattle.value = null
  pokemonDetails.value = {}
  teardownWebSocket()
}

onMounted(async () => {
  if (!authStore.isAuthenticated) return
  await Promise.all([teamStore.loadTeams(), friendStore.refreshAll()])
  await loadBattleData()
  
  // Iniciar WebSocket y polling de solicitudes
  battleSocketService.connect()
  battleSocketService.onNewRequest(() => loadBattleData())
  
  // Polling cada 2 segundos para solicitudes de batalla (fallback + sincronización)
  requestPoller = setInterval(() => {
    loadBattleData()
  }, 2000)
})

onUnmounted(() => {
  closeLiveBattle()
  
  // Limpiar polling de solicitudes
  if (requestPoller) {
    clearInterval(requestPoller)
    requestPoller = null
  }
})
</script>
