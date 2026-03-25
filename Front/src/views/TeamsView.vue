<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 class="text-5xl text-gray-900">Pokemon Squad Builder</h1>
        <span class="trainer-chip">Gym Prep Mode</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Current Team Builder -->
        <div class="lg:col-span-2">
          <div class="pokedex-panel p-6 md:p-8 border-2 border-red-200">
            <h2 class="text-4xl text-gray-900 mb-4">Equipo Actual</h2>

            <div v-if="teamStore.editingTeamId" class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
              <p class="text-sm font-bold text-amber-800">Estas editando un equipo guardado.</p>
              <button
                @click="cancelEditing"
                class="pkmn-btn bg-slate-600 hover:bg-slate-700 text-white text-xs font-black py-1.5 px-3 rounded-lg"
              >
                Cancelar edicion
              </button>
            </div>
            
            <!-- Team Progress -->
            <div class="mb-6">
              <div class="flex justify-between mb-2">
                <span class="text-gray-700 font-black">Pokemon Seleccionados</span>
                <span class="text-gray-700 font-black">{{ teamStore.currentTeam.length }}/{{ teamStore.maxTeamSize }}</span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  class="bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                  :style="{ width: `${(teamStore.currentTeam.length / teamStore.maxTeamSize) * 100}%` }"
                ></div>
              </div>
            </div>

            <!-- Selected Pokemon -->
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div
                v-for="(pokemon, index) in teamStore.currentTeam"
                :key="pokemon.id"
                class="relative bg-gradient-to-br from-red-100 via-amber-100 to-blue-100 rounded-2xl p-4 text-center group border border-white"
              >
                <img
                  :src="pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default"
                  :alt="pokemon.name"
                  class="w-20 h-20 mx-auto object-contain mb-2"
                />
                <p class="text-sm font-black capitalize text-gray-800">{{ pokemon.name }}</p>
                <p class="text-xs text-gray-600 font-bold">Slot {{ index + 1 }}</p>
                <button
                  @click="openMoveEditor(pokemon)"
                  class="mt-2 text-[11px] font-black text-blue-700 hover:text-blue-900"
                >
                  Editar movimientos
                </button>
                <button
                  @click="removeFromTeam(pokemon.id)"
                  class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>

              <!-- Empty Slots -->
              <div
                v-for="i in (teamStore.maxTeamSize - teamStore.currentTeam.length)"
                :key="`empty-${i}`"
                class="bg-white/70 border-2 border-dashed border-slate-300 rounded-2xl p-4 flex items-center justify-center"
              >
                <span class="text-slate-400 text-xl font-black">+</span>
              </div>
            </div>

            <!-- Team Actions -->
            <div class="space-y-3 mb-6">
              <button
                @click="showTeamBuilder"
                class="pkmn-btn w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-2.5 rounded-xl transition"
              >
                Agregar Pokemon
              </button>
              <button
                @click="generateRandomTeam"
                class="pkmn-btn w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-black py-2.5 rounded-xl transition"
              >
                Generar Equipo Aleatorio
              </button>
              <button
                @click="showSaveDialog"
                :disabled="!teamStore.isTeamComplete"
                :class="teamStore.isTeamComplete ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700' : 'bg-gray-400 cursor-not-allowed'"
                class="pkmn-btn w-full text-white font-black py-2.5 rounded-xl transition"
              >
                {{ teamStore.editingTeamId ? 'Actualizar Equipo' : 'Guardar Equipo' }}
              </button>
              <button
                @click="teamStore.clearCurrentTeam"
                class="pkmn-btn w-full bg-slate-700 hover:bg-slate-800 text-white font-black py-2.5 rounded-xl transition"
              >
                Limpiar Equipo
              </button>
            </div>

            <!-- Info -->
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p class="text-blue-800 font-semibold">
                Necesitas {{ teamStore.pokemonNeeded }} Pokemon mas para completar tu equipo
              </p>
            </div>
          </div>
        </div>

        <!-- Right: Saved Teams -->
        <div>
          <div class="pokedex-panel p-6 border-2 border-blue-200">
            <h2 class="text-4xl text-gray-900 mb-4">Equipos Guardados</h2>

            <div v-if="teamStore.error" class="bg-red-100 text-red-700 border border-red-200 rounded-xl p-3 mb-4 text-sm font-semibold">
              {{ teamStore.error }}
            </div>
            
            <div v-if="teamStore.teams.length === 0" class="text-center py-8">
              <p class="text-gray-700 mb-2 font-bold">No tienes equipos guardados</p>
              <p class="text-sm text-gray-500">Crea y guarda tu primer equipo.</p>
            </div>

            <div v-else class="space-y-3 max-h-[60vh] overflow-y-auto">
              <div
                v-for="team in teamStore.teams"
                :key="team.id"
                class="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-3 border border-slate-200 hover:border-blue-300 transition"
              >
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-black text-gray-800">{{ team.name }}</h3>
                  <button
                    @click="deleteTeam(team.id)"
                    class="text-red-600 hover:text-red-800 font-black"
                  >
                    🗑️
                  </button>
                </div>
                <p class="text-xs text-gray-600 mb-2 font-semibold">
                  Creado: {{ new Date(team.createdAt).toLocaleDateString() }}
                </p>
                <div class="flex gap-1 mb-2 flex-wrap">
                  <img
                    v-for="pokemon in team.pokemon"
                    :key="pokemon.id"
                    :src="pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default"
                    :alt="pokemon.name"
                    class="w-8 h-8 object-contain bg-white rounded p-0.5"
                    :title="pokemon.name"
                  />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="editSavedTeam(team.id)"
                    class="pkmn-btn bg-blue-500 hover:bg-blue-600 text-white text-xs font-black py-1.5 rounded-lg transition"
                  >
                    Editar
                  </button>
                  <button
                    @click="loadTeamForBattle(team.id)"
                    class="pkmn-btn bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black py-1.5 rounded-lg transition"
                  >
                    Cargar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Move Editor Dialog -->
      <teleport to="body">
        <div v-if="moveDialogOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl p-6 max-w-2xl w-full border-2 border-blue-200 max-h-[90vh] overflow-y-auto">
            <h3 class="text-4xl text-gray-900 mb-2">Movimientos</h3>
            <p class="text-sm text-gray-600 mb-3">
              {{ moveEditorPokemon?.name }} - selecciona hasta 4 movimientos
            </p>

            <input
              v-model="moveSearchQuery"
              type="text"
              placeholder="Buscar movimiento..."
              class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 mb-3"
            />

            <p class="text-xs text-gray-500 font-semibold mb-2">
              Seleccionados: {{ selectedMoveNames.length }}/4
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto border rounded-xl p-3 bg-slate-50">
              <label
                v-for="moveName in filteredMoveOptions"
                :key="moveName"
                class="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2 border"
              >
                <input
                  type="checkbox"
                  :checked="selectedMoveNames.includes(moveName)"
                  :disabled="!selectedMoveNames.includes(moveName) && selectedMoveNames.length >= 4"
                  @change="toggleMoveSelection(moveName)"
                />
                <span class="capitalize font-semibold">{{ moveName }}</span>
              </label>
            </div>

            <div class="flex gap-3 mt-4">
              <button
                @click="saveMoveSelection"
                class="pkmn-btn flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-2 rounded-xl"
              >
                Guardar movimientos
              </button>
              <button
                @click="closeMoveEditor"
                class="pkmn-btn flex-1 bg-gray-500 hover:bg-gray-600 text-white font-black py-2 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </teleport>

      <!-- Pokemon Builder Modal -->
      <teleport to="body">
        <div v-if="teamBuilderOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 p-4">
          <div class="bg-white rounded-2xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto border-2 border-red-200">
            <div class="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 class="text-4xl text-gray-900">Selecciona Pokemon</h3>
              <button
                @click="teamBuilderOpen = false"
                class="text-gray-600 hover:text-gray-900 text-2xl font-black"
              >
                ✕
              </button>
            </div>

            <!-- Search in modal -->
            <div class="p-6 border-b bg-gray-50">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar Pokemon..."
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600"
              />
            </div>

            <!-- Pokemon Grid -->
            <div class="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div
                v-for="pokemon in availablePokemon"
                :key="pokemon.id"
                @click="addToTeam(pokemon)"
                class="bg-gray-100 hover:bg-gray-200 rounded-xl p-3 text-center cursor-pointer transition border border-transparent hover:border-blue-300"
              >
                <img
                  :src="pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default"
                  :alt="pokemon.name"
                  class="w-20 h-20 mx-auto object-contain mb-2"
                />
                <p class="text-sm font-bold capitalize text-gray-800">{{ pokemon.name }}</p>
              </div>
            </div>
          </div>
        </div>
      </teleport>

      <!-- Save Team Dialog -->
      <teleport to="body">
        <div v-if="saveDialogOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl p-6 max-w-sm w-full border-2 border-emerald-200">
            <h3 class="text-4xl text-gray-900 mb-4">Guardar Equipo</h3>
            <input
              v-model="teamName"
              type="text"
              placeholder="Nombre del equipo"
              class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 mb-4"
            />
            <div class="flex gap-3">
              <button
                @click="saveTeam"
                class="pkmn-btn flex-1 bg-green-600 hover:bg-green-700 text-white font-black py-2 rounded-xl transition"
              >
                {{ teamStore.editingTeamId ? 'Actualizar' : 'Guardar' }}
              </button>
              <button
                @click="saveDialogOpen = false"
                class="pkmn-btn flex-1 bg-gray-500 hover:bg-gray-600 text-white font-black py-2 rounded-xl transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { usePokemonStore } from '@/stores/pokemonStore'
import { useAuthStore } from '@/stores/authStore'

const teamStore = useTeamStore()
const pokemonStore = usePokemonStore()
const authStore = useAuthStore()
const teamBuilderOpen = ref(false)
const saveDialogOpen = ref(false)
const teamName = ref('')
const searchQuery = ref('')
const moveDialogOpen = ref(false)
const moveEditorPokemonId = ref(null)
const moveSearchQuery = ref('')
const selectedMoveNames = ref([])

const availablePokemon = computed(() => {
  let result = pokemonStore.allPokemon
  
  if (searchQuery.value) {
    result = result.filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }
  
  // Filtrar pokemon ya en el equipo
  result = result.filter(p => !teamStore.currentTeam.find(tp => tp.id === p.id))
  
  return result
})

const moveEditorPokemon = computed(() => {
  return teamStore.currentTeam.find((pokemon) => pokemon.id === moveEditorPokemonId.value) || null
})

function extractMoveName(move) {
  if (!move) return ''
  if (typeof move === 'string') return String(move).toLowerCase()
  return String(move?.name || move?.move?.name || '').toLowerCase()
}

const moveOptions = computed(() => {
  const pokemon = moveEditorPokemon.value
  if (!pokemon) return []

  const names = (pokemon.moves || [])
    .map((move) => extractMoveName(move))
    .filter(Boolean)

  return Array.from(new Set(names))
})

const filteredMoveOptions = computed(() => {
  if (!moveSearchQuery.value.trim()) return moveOptions.value
  const q = moveSearchQuery.value.trim().toLowerCase()
  return moveOptions.value.filter((name) => name.includes(q))
})

const showTeamBuilder = async () => {
  if (pokemonStore.allPokemon.length === 0) {
    await pokemonStore.fetchAllPokemon()
  }
  teamBuilderOpen.value = true
}

const addToTeam = (pokemon) => {
  const added = teamStore.addToCurrentTeam(pokemon)
  if (added && teamStore.isTeamComplete) {
    teamBuilderOpen.value = false
  }
}

const removeFromTeam = (pokemonId) => {
  teamStore.removeFromCurrentTeam(pokemonId)
}

const generateRandomTeam = async () => {
  await teamStore.generateRandomTeam()
}

const showSaveDialog = () => {
  if (!teamStore.editingTeamId) {
    teamName.value = ''
  }
  saveDialogOpen.value = true
}

const saveTeam = async () => {
  if (teamName.value.trim()) {
    try {
      await teamStore.saveCurrentTeam(teamName.value)
      saveDialogOpen.value = false
      teamStore.clearCurrentTeam()
      teamName.value = ''
    } catch (error) {
      alert(error?.response?.data?.error || error?.message || 'No se pudo guardar el equipo')
    }
  }
}

const deleteTeam = async (teamId) => {
  if (confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
    try {
      await teamStore.deleteTeam(teamId)
    } catch (error) {
      alert(error?.response?.data?.error || 'No se pudo eliminar el equipo')
    }
  }
}

const loadTeamForBattle = async (teamId) => {
  const team = await teamStore.loadTeam(teamId)
  if (team) {
    // Aquí podrías navegar a batallas si lo deseas
    alert(`Equipo "${team.name}" cargado`)
  }
}

const editSavedTeam = async (teamId) => {
  const team = await teamStore.startEditingTeam(teamId)
  if (team) {
    teamName.value = team.name
    saveDialogOpen.value = true
  }
}

const cancelEditing = () => {
  teamStore.cancelEditingTeam()
  teamStore.clearCurrentTeam()
  teamName.value = ''
}

const openMoveEditor = (pokemon) => {
  moveEditorPokemonId.value = pokemon.id
  moveSearchQuery.value = ''

  const existing = Array.isArray(pokemon.selectedMoves) ? pokemon.selectedMoves : []
  const names = existing.map((move) => extractMoveName(move)).filter(Boolean)
  if (names.length > 0) {
    selectedMoveNames.value = names.slice(0, 4)
  } else {
    selectedMoveNames.value = moveOptions.value.slice(0, 4)
  }

  moveDialogOpen.value = true
}

const closeMoveEditor = () => {
  moveDialogOpen.value = false
  moveEditorPokemonId.value = null
  moveSearchQuery.value = ''
  selectedMoveNames.value = []
}

const toggleMoveSelection = (moveName) => {
  if (selectedMoveNames.value.includes(moveName)) {
    selectedMoveNames.value = selectedMoveNames.value.filter((name) => name !== moveName)
    return
  }

  if (selectedMoveNames.value.length >= 4) return
  selectedMoveNames.value = [...selectedMoveNames.value, moveName]
}

const saveMoveSelection = () => {
  if (!moveEditorPokemon.value) return
  if (selectedMoveNames.value.length === 0) {
    alert('Selecciona al menos un movimiento')
    return
  }

  teamStore.setPokemonMoves(moveEditorPokemon.value.id, selectedMoveNames.value)
  closeMoveEditor()
}

onMounted(async () => {
  console.log('TeamsView mounted')
  console.log('Auth token:', authStore.token ? 'Present' : 'Missing')
  console.log('Auth is authenticated:', authStore.isAuthenticated)
  await teamStore.loadTeams()
})
</script>

<style scoped>
</style>
