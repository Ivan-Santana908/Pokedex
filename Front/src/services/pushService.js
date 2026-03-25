import axios from 'axios'
import { getBackendUrl } from './apiBaseUrl'

const BACKEND_URL = getBackendUrl()

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
})

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }

  return Notification.requestPermission()
}

export async function subscribeToPush(token) {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service worker not supported')
  }

  const registration = await navigator.serviceWorker.ready

  const { data } = await api.get('/push/public-key')
  if (!data?.publicKey) {
    throw new Error('VAPID public key is not configured in backend')
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(data.publicKey),
  })

  await api.post(
    '/push/subscribe',
    { subscription: subscription.toJSON() },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return subscription
}

export default { requestNotificationPermission, subscribeToPush }
