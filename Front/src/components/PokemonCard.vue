<template>
  <div class="bg-white rounded-lg shadow-lg hover:shadow-2xl overflow-hidden transition transform hover:scale-105 cursor-pointer" @click="showDetails">
    <!-- Card Header with Type Colors -->
    <div :class="typeColor" class="h-24 flex items-center justify-center relative">
      <button
        v-if="showFavoriteToggle"
        @click.stop="toggleFavorite"
        :title="isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'"
        class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-xl font-black leading-none text-rose-600 shadow"
      >
        {{ isFavorite ? '★' : '☆' }}
      </button>
      <div class="text-center">
        <span class="text-white text-xs font-bold uppercase">{{ pokemon.types[0]?.type.name }}</span>
      </div>
    </div>

    <!-- Pokemon Image -->
    <div class="flex justify-center py-4 bg-gray-100">
      <img
        :src="pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default"
        :alt="pokemon.name"
        class="w-32 h-32 object-contain"
      />
    </div>

    <!-- Card Info -->
    <div class="p-4">
      <h3 class="text-lg font-bold capitalize text-gray-800 mb-2">{{ pokemon.name }}</h3>
      
      <!-- Types -->
      <div class="flex gap-2 mb-3 flex-wrap">
        <span
          v-for="type in pokemon.types"
          :key="type.type.name"
          :class="getTypeColor(type.type.name)"
          class="text-white text-xs px-2 py-1 rounded-full"
        >
          {{ type.type.name }}
        </span>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-3 gap-2 mb-4 text-center">
        <div class="bg-gray-100 rounded p-2">
          <p class="text-xs text-gray-600">HP</p>
          <p class="text-sm font-bold text-gray-800">{{ pokemon.stats[0].base_stat }}</p>
        </div>
        <div class="bg-gray-100 rounded p-2">
          <p class="text-xs text-gray-600">ATK</p>
          <p class="text-sm font-bold text-gray-800">{{ pokemon.stats[1].base_stat }}</p>
        </div>
        <div class="bg-gray-100 rounded p-2">
          <p class="text-xs text-gray-600">DEF</p>
          <p class="text-sm font-bold text-gray-800">{{ pokemon.stats[2].base_stat }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-2">
        <button
          v-if="showAddToTeam"
          @click.stop="addToTeam"
          :disabled="isInTeam"
          :class="isInTeam ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'"
          class="w-full text-white font-semibold py-2 rounded transition"
        >
          {{ isInTeam ? 'En Equipo' : 'Agregar a Equipo' }}
        </button>
        <button
          @click.stop="showDetails"
          class="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-2 rounded transition"
        >
          Ver Detalles
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTeamStore } from '@/stores/teamStore'

const props = defineProps({
  pokemon: {
    type: Object,
    required: true
  },
  showAddToTeam: {
    type: Boolean,
    default: false
  },
  showFavoriteToggle: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['show-details', 'add-to-team', 'toggle-favorite'])
const teamStore = useTeamStore()

const typeColor = computed(() => {
  return getTypeColor(props.pokemon.types[0]?.type.name)
})

const isInTeam = computed(() => {
  return teamStore.currentTeam.some(p => p.id === props.pokemon.id)
})

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

const getTypeColor = (type) => {
  return typeColors[type] || 'bg-gray-400'
}

const showDetails = () => {
  emit('show-details', props.pokemon)
}

const addToTeam = () => {
  emit('add-to-team', props.pokemon)
}

const toggleFavorite = () => {
  emit('toggle-favorite', props.pokemon)
}
</script>

<style scoped>
</style>
