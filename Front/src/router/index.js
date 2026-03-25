import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

// Componentes cargados con lazy loading
const PokemonView = () => import('@/views/PokemonView.vue')
const TeamsView = () => import('@/views/TeamsView.vue')
const BattlesView = () => import('@/views/BattlesView.vue')
const FriendsView = () => import('@/views/FriendsView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const RegisterView = () => import('@/views/RegisterView.vue')
const ProfileView = () => import('@/views/ProfileView.vue')
const NotificationsView = () => import('@/views/NotificationsView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/pokemon'
    },
    {
      path: '/pokemon',
      name: 'pokemon',
      component: PokemonView,
      meta: { preload: true } // Precargar esta vista
    },
    {
      path: '/teams',
      name: 'teams',
      component: TeamsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/battles',
      name: 'battles',
      component: BattlesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/friends',
      name: 'friends',
      component: FriendsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { publicOnly: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { publicOnly: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

// Precargar rutas importantes
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  authStore.initializeAuth().then(() => {
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }

    if (to.meta.publicOnly && authStore.isAuthenticated) {
      next('/pokemon')
      return
    }

    if (to.meta.preload) {
      // Precargar datos si es necesario
    }

    next()
  })

  
})

export default router


