<template>
  <div class="min-h-screen bg-gradient-to-b from-red-100 to-yellow-100">
    <!-- Hero Section -->
    <section class="py-16 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
          ¡Bienvenido a PokéDex!
        </h1>
        <p class="text-xl text-gray-700 mb-8">
          Captura, colecciona y batalla con los mejores Pokémon del mundo
        </p>
        <div class="flex gap-4 justify-center flex-wrap">
          <router-link
            to="/pokemon"
            class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Explorar Pokémon
          </router-link>
          <router-link
            to="/teams"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Crear Equipo
          </router-link>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 px-4">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-bold text-gray-800 mb-12 text-center">Características</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Feature 1 -->
          <div class="bg-white rounded-lg shadow-lg p-6 text-center">
            <div class="text-4xl mb-3">🔍</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Buscar Pokémon</h3>
            <p class="text-gray-600">Encuentra tus Pokémon favoritos por nombre o tipo</p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-white rounded-lg shadow-lg p-6 text-center">
            <div class="text-4xl mb-3">👥</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Crear Equipos</h3>
            <p class="text-gray-600">Forma equipos de 6 Pokémon y guárdalos</p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-white rounded-lg shadow-lg p-6 text-center">
            <div class="text-4xl mb-3">⚔️</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Batallas</h3>
            <p class="text-gray-600">Batalla contra la máquina o tus amigos</p>
          </div>

          <!-- Feature 4 -->
          <div class="bg-white rounded-lg shadow-lg p-6 text-center">
            <div class="text-4xl mb-3">👫</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Amigos</h3>
            <p class="text-gray-600">Conecta con otros entrenadores Pokémon</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8 mt-16">
      <div class="max-w-6xl mx-auto px-4 text-center">
        <p>Proyecto Escolar - PokéDex PWA © 2026</p>
        <p class="text-gray-400 text-sm mt-2">Datos obtenidos de PokéAPI</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
</style>
