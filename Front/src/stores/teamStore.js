import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usePokemonStore } from './pokemonStore'
import { useAuthStore } from './authStore'
import teamService from '@/services/teamService'

export const useTeamStore = defineStore('team', () => {
  const teams = ref([])
  const currentTeam = ref([])
  const editingTeamId = ref(null)
  const loading = ref(false)
  const error = ref('')
  const maxTeamSize = 6

  function extractMoveName(move) {
    if (!move) return null
    if (typeof move === 'string') return String(move).toLowerCase()
    return String(move?.name || move?.move?.name || '').toLowerCase() || null
  }

  function getLegalMoveNames(pokemon) {
    const legal = new Set()
    ;(pokemon?.moves || []).forEach((move) => {
      const moveName = extractMoveName(move)
      if (moveName) legal.add(moveName)
    })
    return legal
  }

  function normalizeSelectedMoves(pokemon, selectedMoves) {
    const legal = getLegalMoveNames(pokemon)
    const source = Array.isArray(selectedMoves) ? selectedMoves : []
    const normalized = []

    source.forEach((move) => {
      const moveName = extractMoveName(move)
      if (!moveName) return
      if (legal.size && !legal.has(moveName)) return
      if (normalized.find((entry) => entry.name === moveName)) return

      if (typeof move === 'string') {
        normalized.push({
          name: moveName,
          type: 'normal',
          category: 'physical',
          power: 40,
          accuracy: 100,
          pp: 35,
        })
        return
      }

      normalized.push({
        name: moveName,
        type: String(move?.type || 'normal').toLowerCase(),
        category: String(move?.category || 'physical').toLowerCase(),
        power: Number(move?.power ?? 40),
        accuracy: Number(move?.accuracy ?? 100),
        pp: Number(move?.pp ?? 35),
      })
    })

    if (normalized.length === 0) {
      const fallbackMoves = (pokemon?.moves || []).slice(0, 4)
      fallbackMoves.forEach((move) => {
        const moveName = extractMoveName(move)
        if (!moveName) return
        normalized.push({
          name: moveName,
          type: 'normal',
          category: 'physical',
          power: 40,
          accuracy: 100,
          pp: 35,
        })
      })
    }

    return normalized.slice(0, 4)
  }

  function buildSpriteUrl(pokemonId) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`
  }

  function getStatFromPokemon(pokemon, statName, fallback = 50) {
    if (Array.isArray(pokemon?.stats)) {
      const found = pokemon.stats.find((s) => s?.stat?.name === statName)
      if (found?.base_stat != null) return Number(found.base_stat)
      if (pokemon.stats[statName] != null) return Number(pokemon.stats[statName])
    }

    if (pokemon?.stats?.[statName] != null) {
      return Number(pokemon.stats[statName])
    }

    return fallback
  }

  function toTeamMember(pokemon) {
    const selected = Array.isArray(pokemon?.selectedMoves)
      ? pokemon.selectedMoves
      : (pokemon?.moves || []).slice(0, 4)

    const moves = normalizeSelectedMoves(pokemon, selected)

    return {
      pokemonId: Number(pokemon.id),
      pokemonName: String(pokemon.name).toLowerCase(),
      level: Number(pokemon.level || 50),
      types: (pokemon.types || []).map((t) => String(t?.type?.name || t).toLowerCase()),
      spriteUrl:
        pokemon?.sprites?.other?.['official-artwork']?.front_default ||
        pokemon?.sprites?.front_default ||
        buildSpriteUrl(Number(pokemon.id)),
      stats: {
        hp: getStatFromPokemon(pokemon, 'hp', 60),
        attack: getStatFromPokemon(pokemon, 'attack', 60),
        defense: getStatFromPokemon(pokemon, 'defense', 60),
        specialAttack: getStatFromPokemon(pokemon, 'special-attack', 60),
        specialDefense: getStatFromPokemon(pokemon, 'special-defense', 60),
        speed: getStatFromPokemon(pokemon, 'speed', 60),
      },
      moves,
    }
  }

  function fromTeamMember(member) {
    const stats = member?.stats || {}
    const spriteUrl = member?.spriteUrl || buildSpriteUrl(Number(member?.pokemonId || 0))

    function statValue(name, fallback = 60) {
      if (Array.isArray(stats)) {
        const found = stats.find((s) => s?.stat?.name === name || s?.name === name)
        if (found?.base_stat != null) return Number(found.base_stat)
        if (found?.value != null) return Number(found.value)
      }

      const direct = {
        hp: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        'special-attack': stats.specialAttack ?? stats['special-attack'],
        'special-defense': stats.specialDefense ?? stats['special-defense'],
        speed: stats.speed,
      }

      if (direct[name] != null) return Number(direct[name])
      return fallback
    }

    return {
      id: Number(member?.pokemonId || 0),
      name: String(member?.pokemonName || 'unknown'),
      sprites: {
        front_default: spriteUrl,
        other: {
          'official-artwork': {
            front_default: spriteUrl,
          },
        },
      },
      types: (member?.types || []).map((typeName) => ({ type: { name: typeName } })),
      moves: (member?.moves || []).map((move) => ({ name: move.name, ...move })),
      stats: [
        { stat: { name: 'hp' }, base_stat: statValue('hp') },
        { stat: { name: 'attack' }, base_stat: statValue('attack') },
        { stat: { name: 'defense' }, base_stat: statValue('defense') },
        { stat: { name: 'special-attack' }, base_stat: statValue('special-attack') },
        { stat: { name: 'special-defense' }, base_stat: statValue('special-defense') },
        { stat: { name: 'speed' }, base_stat: statValue('speed') },
      ],
    }
  }

  function fromApiTeam(rawTeam) {
    const rawMembers = Array.isArray(rawTeam?.members)
      ? rawTeam.members
      : Array.isArray(rawTeam?.pokemon)
      ? rawTeam.pokemon
      : []

    return {
      id: String(rawTeam?._id || rawTeam?.id || ''),
      name: String(rawTeam?.name || 'Team'),
      createdAt: rawTeam?.createdAt,
      isActive: Boolean(rawTeam?.isActive),
      members: rawMembers,
      pokemon: rawMembers.map(fromTeamMember),
    }
  }

  async function loadTeams() {
    const authStore = useAuthStore()
    if (!authStore.token) {
      teams.value = []
      return
    }

    loading.value = true
    error.value = ''

    try {
      const data = await teamService.listTeams(authStore.token)
      console.log('Teams API Response:', data)
      const rawTeams = Array.isArray(data?.teams) ? data.teams : Array.isArray(data) ? data : []
      console.log('Raw teams:', rawTeams)

      teams.value = rawTeams
        .map((team) => {
          try {
            const parsed = fromApiTeam(team)
            console.log('Parsed team:', parsed)
            return parsed
          } catch (err) {
            console.error('Error parsing team:', team, err)
            return null
          }
        })
        .filter(Boolean)
      console.log('Final teams:', teams.value)
    } catch (err) {
      console.error('Teams API error:', err)
      error.value = err?.response?.data?.error || 'No se pudieron cargar los equipos'
    } finally {
      loading.value = false
    }
  }

  // Agregar pokemon al equipo actual
  function addToCurrentTeam(pokemon) {
    if (currentTeam.value.length < maxTeamSize) {
      if (!currentTeam.value.find(p => p.id === pokemon.id)) {
        const selectedMoves = normalizeSelectedMoves(pokemon, (pokemon?.moves || []).slice(0, 4))

        currentTeam.value.push({
          ...pokemon,
          selectedMoves,
          addedAt: new Date().getTime()
        })
        return true
      }
    }
    return false
  }

  // Remover pokemon del equipo actual
  function removeFromCurrentTeam(pokemonId) {
    currentTeam.value = currentTeam.value.filter(p => p.id !== pokemonId)
  }

  // Limpiar equipo actual
  function clearCurrentTeam() {
    currentTeam.value = []
    editingTeamId.value = null
  }

  // Generar equipo aleatorio
  async function generateRandomTeam() {
    const pokemonStore = usePokemonStore()
    
    clearCurrentTeam()
    
    // Generar IDs aleatorios entre 1 y 151 (primera generación)
    // Puedes cambiar 151 a 1025 para incluir todas las generaciones
    const maxPokemonId = 151
    const randomIds = new Set()
    
    // Generar 6 IDs únicos aleatorios
    while (randomIds.size < maxTeamSize) {
      const randomId = Math.floor(Math.random() * maxPokemonId) + 1
      randomIds.add(randomId)
    }
    
    // Cargar los pokémon de la API
    try {
      const pokemonPromises = Array.from(randomIds).map(id => 
        pokemonStore.getPokemonDetails(id)
      )
      
      const loadedPokemon = await Promise.all(pokemonPromises)
      currentTeam.value = loadedPokemon
        .filter(p => p !== null && p !== undefined)
        .map((pokemon) => ({
          ...pokemon,
          selectedMoves: normalizeSelectedMoves(pokemon, (pokemon?.moves || []).slice(0, 4)),
        }))

      editingTeamId.value = null
    } catch (err) {
      console.error('Error generando equipo aleatorio:', err)
    }
  }

  // Guardar equipo actual
  async function saveCurrentTeam(teamName) {
    if (currentTeam.value.length === 0) return false

    const authStore = useAuthStore()
    if (!authStore.token) {
      throw new Error('Debes iniciar sesión para guardar equipos')
    }

    const payload = {
      name: teamName || `Team ${teams.value.length + 1}`,
      members: currentTeam.value.map(toTeamMember),
    }

    console.log('Saving team with payload:', JSON.stringify(payload, null, 2))

    let persistedTeam

    if (editingTeamId.value) {
      console.log('Updating existing team:', editingTeamId.value)
      const data = await teamService.updateTeam(authStore.token, editingTeamId.value, payload)
      console.log('Update response:', data)
      persistedTeam = fromApiTeam(data.team)
    } else {
      console.log('Creating new team')
      const data = await teamService.createTeam(authStore.token, payload)
      console.log('Create response:', data)
      persistedTeam = fromApiTeam(data.team)
    }

    console.log('Persisted team object:', persistedTeam)

    teams.value = [
      persistedTeam,
      ...teams.value.filter((team) => team.id !== persistedTeam.id),
    ]

    try {
      await loadTeams()
    } catch {
      // Si falla la sincronizacion, mantenemos el equipo recien creado en UI.
    }

    editingTeamId.value = null

    return persistedTeam
  }

  // Eliminar equipo guardado
  async function deleteTeam(teamId) {
    const authStore = useAuthStore()
    if (!authStore.token) return

    await teamService.deleteTeam(authStore.token, teamId)
    if (editingTeamId.value === teamId) {
      clearCurrentTeam()
    }
    await loadTeams()
  }

  // Cargar equipo guardado
  async function loadTeam(teamId) {
    const team = teams.value.find(t => t.id === teamId)
    if (team) {
      const pokemonStore = usePokemonStore()

      const enrichedTeam = await Promise.all(
        team.pokemon.map(async (memberPokemon) => {
          try {
            const fullPokemon = await pokemonStore.getPokemonDetails(memberPokemon.id)
            return {
              ...fullPokemon,
              selectedMoves: normalizeSelectedMoves(fullPokemon, memberPokemon.moves || []),
            }
          } catch {
            return {
              ...memberPokemon,
              selectedMoves: normalizeSelectedMoves(memberPokemon, memberPokemon.moves || []),
            }
          }
        })
      )

      currentTeam.value = enrichedTeam
      return team
    }
    return null
  }

  async function startEditingTeam(teamId) {
    const team = await loadTeam(teamId)
    if (!team) return null
    editingTeamId.value = team.id
    return team
  }

  function cancelEditingTeam() {
    editingTeamId.value = null
  }

  function setPokemonMoves(pokemonId, selectedMoves) {
    const pokemon = currentTeam.value.find((entry) => entry.id === pokemonId)
    if (!pokemon) return false

    pokemon.selectedMoves = normalizeSelectedMoves(pokemon, selectedMoves).slice(0, 4)
    return true
  }

  // Actualizar nombre del equipo
  async function updateTeamName(teamId, newName) {
    const authStore = useAuthStore()
    if (!authStore.token) return

    await teamService.updateTeam(authStore.token, teamId, { name: newName })
    await loadTeams()
  }

  async function setActiveTeam(teamId) {
    const authStore = useAuthStore()
    if (!authStore.token) return

    await teamService.setActiveTeam(authStore.token, teamId)
    await loadTeams()
  }

  // Verificar si está completo
  const isTeamComplete = computed(() => currentTeam.value.length === maxTeamSize)

  // Contar pokemon faltantes
  const pokemonNeeded = computed(() => maxTeamSize - currentTeam.value.length)

  return {
    teams,
    currentTeam,
    editingTeamId,
    loading,
    error,
    maxTeamSize,
    isTeamComplete,
    pokemonNeeded,
    loadTeams,
    addToCurrentTeam,
    removeFromCurrentTeam,
    clearCurrentTeam,
    generateRandomTeam,
    saveCurrentTeam,
    deleteTeam,
    loadTeam,
    startEditingTeam,
    cancelEditingTeam,
    setPokemonMoves,
    updateTeamName,
    setActiveTeam,
  }
})
