<template>
  <nav class="gb-navbar">
    <div class="gb-wrap">
      <div class="gb-head">
        <router-link to="/" class="gb-brand" @click="mobileOpen = false">
          <span class="gb-brand-main">POKEDEX OS</span>
          <span class="gb-brand-sub">CARTRIDGE V1</span>
        </router-link>

        <div class="gb-status">
          <span class="gb-led"></span>
          <span class="gb-status-text">{{ authStore.isAuthenticated ? (authStore.user?.username || 'PLAYER') : 'GUEST' }}</span>
        </div>

        <button class="gb-menu" @click="mobileOpen = !mobileOpen">MENU</button>
      </div>

      <div class="gb-links desktop-only">
        <router-link to="/pokemon" class="gb-link" :class="{ active: route.path === '/pokemon' }">POKEDEX</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/teams" class="gb-link" :class="{ active: route.path === '/teams' }">Equipos</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/battles" class="gb-link" :class="{ active: route.path === '/battles' }">Batallas</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/friends" class="gb-link" :class="{ active: route.path === '/friends' }">
          Amigos
          <span v-if="pendingRequests > 0" class="gb-badge">{{ pendingRequests }}</span>
        </router-link>
        <router-link v-if="authStore.isAuthenticated" to="/notifications" class="gb-link" :class="{ active: route.path === '/notifications' }">
          Notificaciones
          <span v-if="notificationStore.unreadCount > 0" class="gb-badge">{{ notificationStore.unreadCount }}</span>
        </router-link>
        <router-link v-if="authStore.isAuthenticated" to="/profile" class="gb-link" :class="{ active: route.path === '/profile' }">Perfil</router-link>
        <router-link v-if="!authStore.isAuthenticated" to="/login" class="gb-link" :class="{ active: route.path === '/login' }">LOGIN</router-link>
        <router-link v-if="!authStore.isAuthenticated" to="/register" class="gb-link" :class="{ active: route.path === '/register' }">REGISTER</router-link>
        <button v-if="authStore.isAuthenticated" @click="handleLogout" class="gb-link gb-link-danger">LOGOUT</button>
      </div>

      <div v-if="mobileOpen" class="gb-links mobile-only">
        <router-link to="/pokemon" class="gb-link" :class="{ active: route.path === '/pokemon' }" @click="mobileOpen = false">POKEDEX</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/teams" class="gb-link" :class="{ active: route.path === '/teams' }" @click="mobileOpen = false">TEAMS</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/battles" class="gb-link" :class="{ active: route.path === '/battles' }" @click="mobileOpen = false">BATTLES</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/friends" class="gb-link" :class="{ active: route.path === '/friends' }" @click="mobileOpen = false">
          Amigos
          <span v-if="pendingRequests > 0" class="gb-badge">{{ pendingRequests }}</span>
        </router-link>
        <router-link v-if="authStore.isAuthenticated" to="/notifications" class="gb-link" :class="{ active: route.path === '/notifications' }" @click="mobileOpen = false">
          Notificaciones
          <span v-if="notificationStore.unreadCount > 0" class="gb-badge">{{ notificationStore.unreadCount }}</span>
        </router-link>
        <router-link v-if="authStore.isAuthenticated" to="/profile" class="gb-link" :class="{ active: route.path === '/profile' }" @click="mobileOpen = false">PROFILE</router-link>
        <router-link v-if="!authStore.isAuthenticated" to="/login" class="gb-link" :class="{ active: route.path === '/login' }" @click="mobileOpen = false">LOGIN</router-link>
        <router-link v-if="!authStore.isAuthenticated" to="/register" class="gb-link" :class="{ active: route.path === '/register' }" @click="mobileOpen = false">REGISTER</router-link>
        <button v-if="authStore.isAuthenticated" @click="handleLogout" class="gb-link gb-link-danger">LOGOUT</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useFriendStore } from '@/stores/friendStore'
import { useNotificationStore } from '@/stores/notificationStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const friendStore = useFriendStore()
const notificationStore = useNotificationStore()
const mobileOpen = ref(false)

const pendingRequests = computed(() => friendStore.getPendingRequests().length)

const handleLogout = () => {
  authStore.logout()
  notificationStore.clearNotifications()
  mobileOpen.value = false
  router.push('/login')
}
</script>

<style scoped>
.gb-navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: linear-gradient(180deg, #565656 0%, #3a3a3a 100%);
  border-bottom: 4px solid #2e2e2e;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 8px 16px rgba(0, 0, 0, 0.4);
}

.gb-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 10px 14px;
}

.gb-head {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  align-items: center;
  background: #9bbc0f;
  border: 3px solid #243000;
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.12), inset 0 -2px 0 rgba(0, 0, 0, 0.2);
  padding: 8px 10px;
}

.gb-brand {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: #1d2506;
}

.gb-brand-main {
  font-family: 'Press Start 2P', cursive;
  font-size: 11px;
}

.gb-brand-sub {
  margin-top: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.6px;
}

.gb-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #1d2506;
}

.gb-led {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #d31e2f;
  border: 1px solid #5d0a11;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2), 0 0 10px rgba(211, 30, 47, 0.5);
}

.gb-status-text {
  font-size: 11px;
  text-transform: uppercase;
}

.gb-menu {
  background: #3b3b3b;
  color: #f3f3f3;
  border: 2px solid #2b2b2b;
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 800;
}

.gb-links {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gb-link {
  position: relative;
  text-decoration: none;
  background: #676767;
  color: #f7f7f7;
  border: 2px solid #333333;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 0 rgba(0, 0, 0, 0.35);
}

.gb-link.active {
  background: #9bbc0f;
  color: #1d2506;
  border-color: #2f3c06;
}

.gb-link-danger {
  background: #aa2d3b;
}

.gb-badge {
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #f7d84b;
  color: #2a2a2a;
  border: 1px solid #1d1d1d;
  font-size: 10px;
}

.mobile-only {
  display: none;
}

@media (max-width: 900px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }
}

@media (min-width: 901px) {
  .gb-menu {
    display: none;
  }
}
</style>
