<template>
  <teleport to="body">
    <div v-if="isOpen && pokemon" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Close Button -->
        <div class="flex justify-between items-center p-6 border-b">
          <h2 class="text-2xl font-bold capitalize text-gray-800">{{ pokemon.name }}</h2>
          <button
            @click="close"
            class="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ✕
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Image and Basic Info -->
          <div class="flex flex-col md:flex-row gap-6">
            <div class="flex-shrink-0">
              <img
                :src="pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default"
                :alt="pokemon.name"
                class="w-64 h-64 object-contain"
              />
            </div>

            <!-- Basic Stats -->
            <div class="flex-1">
              <h3 class="text-lg font-bold mb-4">Información General</h3>
              <div class="space-y-2">
                <p><span class="font-semibold">Peso:</span> {{ (pokemon.weight / 10).toFixed(1) }} kg</p>
                <p><span class="font-semibold">Altura:</span> {{ (pokemon.height / 10).toFixed(1) }} m</p>
                <p><span class="font-semibold">Experiencia Base:</span> {{ pokemon.base_experience }}</p>
                
                <!-- Types -->
                <div>
                  <span class="font-semibold">Tipos:</span>
                  <div class="flex gap-2 mt-2 flex-wrap">
                    <span
                      v-for="type in pokemon.types"
                      :key="type.type.name"
                      :class="getTypeColor(type.type.name)"
                      class="text-white text-sm px-3 py-1 rounded-full"
                    >
                      {{ type.type.name }}
                    </span>
                  </div>
                </div>

                <!-- Abilities -->
                <div>
                  <span class="font-semibold">Habilidades:</span>
                  <div class="flex gap-2 mt-2 flex-wrap">
                    <span
                      v-for="ability in pokemon.abilities"
                      :key="ability.ability.name"
                      class="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full"
                    >
                      {{ ability.ability.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats Bar Chart -->
          <div>
            <h3 class="text-lg font-bold mb-4">Estadísticas Base</h3>
            <div class="space-y-3">
              <div v-for="stat in pokemon.stats" :key="stat.stat.name">
                <div class="flex justify-between mb-1">
                  <span class="text-sm font-semibold capitalize text-gray-700">{{ stat.stat.name }}</span>
                  <span class="text-sm font-bold text-gray-700">{{ stat.base_stat }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${(stat.base_stat / 255) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 flex-col sm:flex-row">
            <button
              v-if="showAddToTeam"
              @click="addToTeam"
              :disabled="isInTeam"
              :class="isInTeam ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'"
              class="flex-1 text-white font-semibold py-2 rounded transition"
            >
              {{ isInTeam ? 'En Equipo' : 'Agregar a Equipo' }}
            </button>
            <button
              @click="close"
              class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useTeamStore } from '@/stores/teamStore'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  pokemon: {
    type: [Object, null],
    default: null
  },
  showAddToTeam: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'add-to-team'])
const teamStore = useTeamStore()

const typeColors = {
  normal: 'bg-pokemon-normal',
  fire: 'bg-pokemon-fire',
  water: 'bg-pokemon-water',
  electric: 'bg-pokemon-electric',
  grass: 'bg-pokemon-grass',
  ice: 'bg-pokemon-ice',
  fighting: 'bg-pokemon-fighting',
  poison: 'bg-pokemon-poison',
  ground: 'bg-pokemon-ground',
  flying: 'bg-pokemon-flying',
  psychic: 'bg-pokemon-psychic',
  bug: 'bg-pokemon-bug',
  rock: 'bg-pokemon-rock',
  ghost: 'bg-pokemon-ghost',
  dragon: 'bg-pokemon-dragon',
  dark: 'bg-pokemon-dark',
  steel: 'bg-pokemon-steel',
  fairy: 'bg-pokemon-fairy'
}

const isInTeam = computed(() => {
  if (!props.pokemon) return false
  return teamStore.currentTeam.some(p => p.id === props.pokemon.id)
})

const getTypeColor = (type) => {
  return typeColors[type] || 'bg-gray-400'
}

const close = () => {
  emit('close')
}

const addToTeam = () => {
  if (!props.pokemon) return
  emit('add-to-team', props.pokemon)
}
</script>

<style scoped>
</style>
