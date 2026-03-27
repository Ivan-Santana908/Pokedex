<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">Pokédex</h1>
      </div>

      <!-- Search and Filter Section -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Search -->
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Buscar Pokémon</label>
            <input
              v-model="searchInput"
              @input="handleSearchInput"
              type="text"
              placeholder="Nombre o ID del Pokémon..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            />
            <p v-if="searchHint" class="text-xs text-blue-600 mt-1">{{ searchHint }}</p>
          </div>

          <!-- Type Filter -->
          <div>
            <label class="block text-gray-700 font-semibold mb-2">Filtrar por Tipo</label>
            <select
              v-model="selectedTypeFilter"
              @change="handleTypeChange"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            >
              <option value="">Todos los Tipos</option>
              <option v-for="type in pokemonStore.pokemonTypes" :key="type.name" :value="type.name">
                {{ type.name }}
              </option>
            </select>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-end gap-2">
            <button
              @click="clearFilters"
              class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        <!-- Sort Options -->
        <div class="flex gap-2 flex-wrap">
          <button
            @click="viewMode = 'all'"
            :class="viewMode === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
            class="px-4 py-2 rounded-lg transition font-semibold"
          >
            Todos
          </button>
          <button
            @click="viewMode = 'favorites'"
            :disabled="!authStore.isAuthenticated"
            :class="viewMode === 'favorites' ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
            class="px-4 py-2 rounded-lg transition font-semibold disabled:opacity-60"
          >
            Favoritos ({{ favoritePokemon.length }})
          </button>
          <button
            v-for="sort in sortOptions"
            :key="sort.value"
            @click="sortOption = sort.value"
            :class="sortOption === sort.value ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
            class="px-4 py-2 rounded-lg transition font-semibold"
          >
            {{ sort.label }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pokemonStore.loading" class="flex justify-center items-center py-16">
        <div class="animate-spin">
          <div class="text-4xl">⏳</div>
        </div>
        <p class="ml-4 text-gray-600 text-lg">Cargando Pokémon...</p>
      </div>

      <!-- Error State -->
      <div v-if="pokemonStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        Error: {{ pokemonStore.error }}
      </div>

      <!-- Pokemon Grid -->
      <div v-if="!pokemonStore.loading && viewMode === 'all'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <pokemon-card
          v-for="pokemon in sortedPokemon"
          :key="pokemon.id"
          :pokemon="pokemon"
          :show-favorite-toggle="authStore.isAuthenticated"
          :is-favorite="isFavoritePokemon(pokemon.id)"
          @show-details="showDetails"
          @toggle-favorite="toggleFavorite"
        />
      </div>

      <div v-if="!pokemonStore.loading && viewMode === 'favorites'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <pokemon-card
          v-for="pokemon in sortedFavoritePokemon"
          :key="pokemon.id"
          :pokemon="pokemon"
          :show-favorite-toggle="authStore.isAuthenticated"
          :is-favorite="isFavoritePokemon(pokemon.id)"
          @show-details="showDetails"
          @toggle-favorite="toggleFavorite"
        />
      </div>

      <!-- Empty State -->
      <div v-if="!pokemonStore.loading && viewMode === 'all' && sortedPokemon.length === 0" class="text-center py-16">
        <p class="text-2xl text-gray-600">No se encontraron Pokémon</p>
        <button
          @click="clearFilters"
          class="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Ver Todos los Pokémon
        </button>
      </div>

      <div v-if="!pokemonStore.loading && viewMode === 'favorites' && sortedFavoritePokemon.length === 0" class="text-center py-16">
        <p class="text-2xl text-gray-600">No tienes Pokémon favoritos aún</p>
        <p class="text-sm text-gray-500 mt-2">Marca con estrella los Pokémon que quieras guardar.</p>
      </div>

      <!-- Pagination -->
      <div v-if="!pokemonStore.loading && viewMode === 'all' && sortedPokemon.length > 0" class="flex justify-center gap-4 mt-8">
        <button
          @click="previousPage"
          :disabled="pokemonStore.currentOffset === 0"
          :class="pokemonStore.currentOffset === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'"
          class="text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          ← Anterior
        </button>
        <span class="text-gray-700 font-semibold py-2">
          Página {{ Math.floor(pokemonStore.currentOffset / 20) + 1 }}
        </span>
        <button
          @click="nextPage"
          :class="sortedPokemon.length < 20 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'"
          class="text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          Siguiente →
        </button>
      </div>
    </div>

    <!-- Detail Modal -->
    <pokemon-detail-modal
      :is-open="detailModalOpen"
      :pokemon="selectedPokemonDetail"
      @close="detailModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePokemonStore } from '@/stores/pokemonStore'
import { useAuthStore } from '@/stores/authStore'
import PokemonCard from '@/components/PokemonCard.vue'
import PokemonDetailModal from '@/components/PokemonDetailModal.vue'
import favoriteService from '@/services/favoriteService'
import pokemonService from '@/services/pokemonService'

const pokemonStore = usePokemonStore()
const authStore = useAuthStore()
const detailModalOpen = ref(false)
const selectedPokemonDetail = ref(null)
const selectedTypeFilter = ref('')
const sortOption = ref('id')
const viewMode = ref('all')
const searchInput = ref('')
const searchHint = ref('')
const searchTimeout = ref(null)
const favoriteIds = ref(new Set())
const favoritePokemon = ref([])

const sortOptions = [
  { value: 'id', label: 'Nº Pokédex' },
  { value: 'name', label: 'Nombre (A-Z)' },
  { value: 'height', label: 'Altura' },
  { value: 'weight', label: 'Peso' },
]

const sortedPokemon = computed(() => {
  const result = [...pokemonStore.filteredPokemon]
  
  switch (sortOption.value) {
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'id':
      result.sort((a, b) => a.id - b.id)
      break
    case 'height':
      result.sort((a, b) => b.height - a.height)
      break
    case 'weight':
      result.sort((a, b) => b.weight - a.weight)
      break
  }
  
  return result
})

const sortedFavoritePokemon = computed(() => {
  const result = [...favoritePokemon.value]
  
  switch (sortOption.value) {
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'id':
      result.sort((a, b) => a.id - b.id)
      break
    case 'height':
      result.sort((a, b) => b.height - a.height)
      break
    case 'weight':
      result.sort((a, b) => b.weight - a.weight)
      break
  }
  
  return result
})

const isFavoritePokemon = (pokemonId) => favoriteIds.value.has(Number(pokemonId))

function setFavoriteId(pokemonId, shouldInclude) {
  const next = new Set(favoriteIds.value)
  if (shouldInclude) next.add(Number(pokemonId))
  else next.delete(Number(pokemonId))
  favoriteIds.value = next
}

async function loadFavorites() {
  if (!authStore.isAuthenticated || !authStore.token) {
    favoriteIds.value = new Set()
    favoritePokemon.value = []
    return
  }

  try {
    const data = await favoriteService.listFavorites(authStore.token)
    const favorites = Array.isArray(data?.favorites) ? data.favorites : []
    const ids = favorites.map((item) => Number(item.pokemonId)).filter((value) => Number.isFinite(value) && value > 0)
    favoriteIds.value = new Set(ids)

    if (ids.length === 0) {
      favoritePokemon.value = []
      return
    }

    const details = await pokemonService.getPokemonDetailsMultiple(ids)
    favoritePokemon.value = Array.isArray(details) ? details.filter(Boolean) : []
  } catch (err) {
    console.error('Error loading favorites:', err)
  }
}

async function toggleFavorite(pokemon) {
  if (!authStore.isAuthenticated || !authStore.token || !pokemon?.id) {
    searchHint.value = 'Inicia sesion para guardar favoritos.'
    return
  }

  const pokemonId = Number(pokemon.id)

  try {
    if (isFavoritePokemon(pokemonId)) {
      await favoriteService.removeFavorite(authStore.token, pokemonId)
      setFavoriteId(pokemonId, false)
      favoritePokemon.value = favoritePokemon.value.filter((item) => Number(item.id) !== pokemonId)
      return
    }

    await favoriteService.addFavorite(authStore.token, pokemon)
    setFavoriteId(pokemonId, true)

    if (!favoritePokemon.value.some((item) => Number(item.id) === pokemonId)) {
      favoritePokemon.value = [pokemon, ...favoritePokemon.value]
    }
  } catch (err) {
    console.error('Error toggling favorite:', err)
  }
}

// Búsqueda mejorada con debounce
const handleSearchInput = async (e) => {
  const query = e.target.value.trim()
  
  clearTimeout(searchTimeout.value)
  
  if (!query) {
    // Cuando el buscador está vacío, mostrar la lista inicial
    searchHint.value = ''
    pokemonStore.clearSearch()
    await pokemonStore.fetchPokemonList()
    return
  }
  
  searchHint.value = 'Buscando...'
  
  searchTimeout.value = setTimeout(async () => {
    await pokemonStore.quickSearch(query)
    
    if (pokemonStore.filteredPokemon.length === 0) {
      if (pokemonStore.searchSuggestion.value) {
        searchHint.value = `No encontrado. ¿Quisiste decir "${pokemonStore.searchSuggestion.value}"?`
      } else {
        searchHint.value = `No se encontró "${query}". Intenta con otro nombre o ID`
      }
    } else {
      searchHint.value = `Se encontraron ${pokemonStore.filteredPokemon.length} resultado(s)`
    }
  }, 500)
}

const handleTypeChange = async () => {
  if (selectedTypeFilter.value) {
    await pokemonStore.fetchPokemonByType(selectedTypeFilter.value)
  } else {
    await pokemonStore.fetchPokemonList()
  }
}

const clearFilters = async () => {
  selectedTypeFilter.value = ''
  searchInput.value = ''
  searchHint.value = ''
  pokemonStore.clearSearch()
  pokemonStore.clearTypeFilter()
  await pokemonStore.fetchPokemonList()
}

const showDetails = async (pokemon) => {
  selectedPokemonDetail.value = pokemon
  detailModalOpen.value = true
}

const nextPage = () => {
  pokemonStore.fetchPokemonList(pokemonStore.currentOffset + 20)
}

const previousPage = () => {
  if (pokemonStore.currentOffset >= 20) {
    pokemonStore.fetchPokemonList(pokemonStore.currentOffset - 20)
  }
}

onMounted(async () => {
  if (pokemonStore.pokemonList.length === 0) {
    await pokemonStore.fetchPokemonList()
  }
  if (pokemonStore.pokemonTypes.length === 0) {
    await pokemonStore.fetchTypes()
  }

  await authStore.initializeAuth()
  await loadFavorites()
})

watch(
  () => authStore.isAuthenticated,
  async () => {
    await loadFavorites()
  }
)
</script>

<style scoped>
</style>
