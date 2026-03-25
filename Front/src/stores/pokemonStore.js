import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import pokemonService from '../services/pokemonService'

export const usePokemonStore = defineStore('pokemon', () => {
  const pokemonList = ref([])
  const allPokemon = ref([])
  const pokemonCache = ref({}) // Cache de detalles individuales
  const selectedPokemon = ref(null)
  const loading = ref(false)
  const loadingAll = ref(false) // Flag para evitar carga concurrente de todos
  const error = ref(null)
  const currentOffset = ref(0)
  const pokemonTypes = ref([])
  const selectedType = ref(null)
  const searchQuery = ref('')
  const allPokemonLoaded = ref(false)
  const searchSuggestion = ref(null) // Sugerencia para búsqueda

  function ensureArray(value) {
    return Array.isArray(value) ? value : []
  }

  // Obtener lista de pokemon (con caché)
  async function fetchPokemonList(offset = 0, limit = 20) {
    loading.value = true
    error.value = null
    try {
      const data = await pokemonService.getPokemonList(offset, limit)
      const results = ensureArray(data?.results)
      if (results.length === 0) {
        throw new Error('Respuesta invalida del backend en /pokemon. Verifica VITE_BACKEND_URL (debe terminar en /api).')
      }
      
      // Obtener detalles de cada pokemon con caché
      const detailedPokemon = await Promise.all(
        results.map(pokemon => {
          if (pokemonCache.value[pokemon.name]) {
            return pokemonCache.value[pokemon.name]
          }
          return pokemonService.getPokemonDetails(pokemon.name)
            .then(details => {
              pokemonCache.value[pokemon.name] = details
              return details
            })
        })
      )
      
      pokemonList.value = detailedPokemon
      currentOffset.value = offset
    } catch (err) {
      error.value = err.message
      console.error('Error fetching pokemon list:', err)
    } finally {
      loading.value = false
    }
  }

  // Obtener todos los pokemon (mejorado con caché y prevención de carga concurrente)
  async function fetchAllPokemon() {
    // Si ya están cargados, retornar inmediatamente
    if (allPokemonLoaded.value && allPokemon.value.length > 0) {
      return
    }
    
    // Si ya se está cargando, esperar a que termine
    if (loadingAll.value) {
      return new Promise((resolve) => {
        const checkLoading = setInterval(() => {
          if (!loadingAll.value) {
            clearInterval(checkLoading)
            resolve()
          }
        }, 100)
      })
    }
    
    loadingAll.value = true
    error.value = null
    try {
      const results = ensureArray(await pokemonService.getAllPokemon())
      if (results.length === 0) {
        throw new Error('No se pudo obtener el listado global de pokemon desde el backend.')
      }
      
      // Cargar solo los primeros 151 pokémon (Gen 1) para mejor rendimiento
      const limitedResults = results.slice(0, 151)
      const batchSize = 20
      const loadedPokemon = []
      
      for (let i = 0; i < limitedResults.length; i += batchSize) {
        const batch = limitedResults.slice(i, i + batchSize)
        const detailedBatch = await Promise.all(
          batch.map(pokemon => {
            if (pokemonCache.value[pokemon.name]) {
              return pokemonCache.value[pokemon.name]
            }
            return pokemonService.getPokemonDetails(pokemon.name)
              .then(details => {
                pokemonCache.value[pokemon.name] = details
                return details
              })
          })
        )
        loadedPokemon.push(...detailedBatch)
        
        // Actualizar progresivamente para mejor UX
        allPokemon.value = loadedPokemon
      }
      
      allPokemonLoaded.value = true
    } catch (err) {
      error.value = err.message
      console.error('Error fetching all pokemon:', err)
    } finally {
      loadingAll.value = false
    }
  }

  // Obtener tipos de pokemon
  async function fetchTypes() {
    try {
      const data = await pokemonService.getPokemonTypes()
      pokemonTypes.value = ensureArray(data?.results)
    } catch (err) {
      console.error('Error fetching types:', err)
    }
  }

  // Obtener pokemon por tipo
  async function fetchPokemonByType(typeName) {
    loading.value = true
    error.value = null
    try {
      selectedType.value = typeName
      const data = await pokemonService.getPokemonByType(typeName)
      const typedPokemon = ensureArray(data?.pokemon)
      
      const detailedPokemon = await Promise.all(
        typedPokemon.slice(0, 100).map(p => {
          if (pokemonCache.value[p.pokemon.name]) {
            return pokemonCache.value[p.pokemon.name]
          }
          return pokemonService.getPokemonDetails(p.pokemon.name)
            .then(details => {
              pokemonCache.value[p.pokemon.name] = details
              return details
            })
        })
      )
      
      pokemonList.value = detailedPokemon
    } catch (err) {
      error.value = err.message
      console.error('Error fetching pokemon by type:', err)
    } finally {
      loading.value = false
    }
  }

  // Buscar pokemon en la lista completa
  function searchPokemon(query) {
    searchQuery.value = query.toLowerCase()
  }

  // Pokemon filtrados (búsqueda + tipo) - MEJORADO
  const filteredPokemon = computed(() => {
    let result = pokemonList.value

    if (searchQuery.value) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.value) ||
        p.id.toString().includes(searchQuery.value)
      )
    }

    return result
  })

  // Búsqueda rápida - busca directamente en la API sin cargar todos
  async function quickSearch(query) {
    const lowerQuery = query.toLowerCase()
    searchSuggestion.value = null // Limpiar sugerencia anterior
    
    try {
      loading.value = true
      error.value = null
      
      // Primero buscar en los pokemon ya cargados
      if (allPokemon.value.length > 0) {
        const localResults = allPokemon.value.filter(p => 
          p.name.toLowerCase().includes(lowerQuery) ||
          p.id.toString().includes(lowerQuery)
        )
        
        if (localResults.length > 0) {
          pokemonList.value = localResults.slice(0, 100)
          error.value = null
          loading.value = false
          return
        }
      }
      
      // Si no encuentra localmente, buscar directamente en la API
      const details = await pokemonService.getPokemonDetails(lowerQuery)
      pokemonList.value = [details]
      pokemonCache.value[details.name] = details
      // Agregar al allPokemon si no está
      if (!allPokemon.value.find(p => p.id === details.id)) {
        allPokemon.value.push(details)
      }
      error.value = null
    } catch (err) {
      // Buscar sugerencias si no se encuentra exactamente
      const suggestion = await pokemonService.findClosestMatch(query)
      if (suggestion) {
        searchSuggestion.value = suggestion
        error.value = `Pokémon "${query}" no encontrado. ¿Quisiste decir "${suggestion}"?`
        try {
          const suggestedPokemon = await pokemonService.getPokemonDetails(suggestion)
          pokemonList.value = [suggestedPokemon]
          pokemonCache.value[suggestedPokemon.name] = suggestedPokemon
          if (!allPokemon.value.find(p => p.id === suggestedPokemon.id)) {
            allPokemon.value.push(suggestedPokemon)
          }
        } catch (innerErr) {
          pokemonList.value = []
          console.error('Error fetching suggested pokemon:', innerErr)
        }
      } else {
        error.value = `Pokémon "${query}" no encontrado`
        pokemonList.value = []
      }
      console.error('Error en quickSearch:', err)
    } finally {
      loading.value = false
    }
  }

  // Obtener detalles de un pokemon
  async function getPokemonDetails(nameOrId) {
    try {
      if (pokemonCache.value[nameOrId]) {
        selectedPokemon.value = pokemonCache.value[nameOrId]
        return pokemonCache.value[nameOrId]
      }
      
      const data = await pokemonService.getPokemonDetails(nameOrId)
      pokemonCache.value[data.name] = data
      selectedPokemon.value = data
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching pokemon details:', err)
    }
  }

  // Limpiar búsqueda y recargar lista inicial
  function clearSearch() {
    searchQuery.value = ''
    searchSuggestion.value = null
  }

  // Limpiar tipo seleccionado
  function clearTypeFilter() {
    selectedType.value = null
    searchQuery.value = ''
  }

  return {
    pokemonList,
    allPokemon,
    selectedPokemon,
    loading,
    loadingAll,
    error,
    currentOffset,
    pokemonTypes,
    selectedType,
    searchQuery,
    searchSuggestion,
    allPokemonLoaded,
    filteredPokemon,
    fetchPokemonList,
    fetchAllPokemon,
    fetchTypes,
    fetchPokemonByType,
    getPokemonDetails,
    searchPokemon,
    quickSearch,
    clearSearch,
    clearTypeFilter,
  }
})

