import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service worker registered')

      // Fuerza chequeo de update para evitar versión vieja del SW en PWA instalada.
      await registration.update()
    } catch (error) {
      console.error('Service worker registration failed:', error)
    }
  })
}

