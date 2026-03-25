import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './authStore'
import friendService from '@/services/friendService'

export const useFriendStore = defineStore('friend', () => {
  const friends = ref([])
  const incomingRequests = ref([])
  const outgoingRequests = ref([])
  const loading = ref(false)
  const error = ref('')

  function normalizeFriend(rawFriend) {
    return {
      id: rawFriend.uid,
      uid: rawFriend.uid,
      username: rawFriend.username,
      displayName: rawFriend.displayName,
      status: 'online',
    }
  }

  async function loadFriends() {
    const authStore = useAuthStore()
    if (!authStore.token) {
      friends.value = []
      return
    }

    const data = await friendService.getFriends(authStore.token)
    friends.value = (data.friends || []).map(normalizeFriend)
  }

  async function loadFriendRequests() {
    const authStore = useAuthStore()
    if (!authStore.token) {
      incomingRequests.value = []
      outgoingRequests.value = []
      return
    }

    const data = await friendService.getFriendRequests(authStore.token)

    incomingRequests.value = (data.incoming || []).map((request) => ({
      id: request.id,
      status: request.status,
      sentAt: request.createdAt,
      uid: request.from.uid,
      username: request.from.username,
      displayName: request.from.displayName,
    }))

    outgoingRequests.value = (data.outgoing || []).map((request) => ({
      id: request.id,
      status: request.status,
      sentAt: request.createdAt,
      uid: request.to.uid,
      username: request.to.username,
      displayName: request.to.displayName,
    }))
  }

  async function refreshAll() {
    loading.value = true
    error.value = ''
    try {
      await Promise.all([loadFriends(), loadFriendRequests()])
    } catch (err) {
      error.value = err?.response?.data?.error || 'No se pudo cargar amigos'
    } finally {
      loading.value = false
    }
  }

  async function sendFriendRequest(toUid) {
    const authStore = useAuthStore()
    if (!authStore.token) return null

    await friendService.sendFriendRequest(authStore.token, String(toUid || '').trim().toUpperCase())
    await loadFriendRequests()
    return true
  }

  async function acceptFriendRequest(requestId) {
    const authStore = useAuthStore()
    if (!authStore.token) return false

    await friendService.respondFriendRequest(authStore.token, requestId, 'accept')
    await refreshAll()
    return true
  }

  async function rejectFriendRequest(requestId) {
    const authStore = useAuthStore()
    if (!authStore.token) return false

    await friendService.respondFriendRequest(authStore.token, requestId, 'reject')
    await loadFriendRequests()
    return true
  }

  function setFriendStatus(friendId, status) {
    const friend = friends.value.find((f) => f.id === friendId)
    if (friend) {
      friend.status = status
    }
  }

  function getPendingRequests() {
    return incomingRequests.value.filter((request) => request.status === 'pending')
  }

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error,
    loadFriends,
    loadFriendRequests,
    refreshAll,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    setFriendStatus,
    getPendingRequests,
  }
})
