/**
 * Servicio de IndexedDB para almacenar cambios pendientes offline
 * Maneja la persistencia local de cambios cuando no hay conexión
 */

const DB_NAME = 'PokedexDB'
const DB_VERSION = 1
const STORE_NAME = 'pendingChanges'

let db = null

/**
 * Inicializar la base de datos IndexedDB
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('Error abriendo IndexedDB:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      console.log('IndexedDB inicializado correctamente')
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        console.log('Object store creado')
      }
    }
  })
}

/**
 * Guardar un cambio pendiente en IndexedDB
 * @param {Object} change - { action: 'add'|'remove', pokemonId, pokemon }
 */
export async function savePendingChange(change) {
  await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const changeData = {
      ...change,
      timestamp: Date.now(),
      synced: false,
    }

    const request = store.add(changeData)

    request.onerror = () => {
      console.error('Error guardando cambio pendiente:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      console.log('Cambio guardado en IndexedDB:', changeData)
      resolve(request.result)
    }
  })
}

/**
 * Obtener todos los cambios pendientes
 */
export async function getPendingChanges() {
  await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => {
      console.error('Error obteniendo cambios pendientes:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      const changes = request.result.filter(c => !c.synced)
      resolve(changes)
    }
  })
}

/**
 * Marcar un cambio como sincronizado
 */
export async function markAsSynced(changeId) {
  await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const getRequest = store.get(changeId)

    getRequest.onsuccess = () => {
      const change = getRequest.result
      if (change) {
        change.synced = true
        const updateRequest = store.put(change)

        updateRequest.onerror = () => reject(updateRequest.error)
        updateRequest.onsuccess = () => {
          console.log('Cambio marcado como sincronizado:', changeId)
          resolve()
        }
      } else {
        resolve()
      }
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

/**
 * Eliminar un cambio sincronizado
 */
export async function deletePendingChange(changeId) {
  await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(changeId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      console.log('Cambio eliminado de IndexedDB:', changeId)
      resolve()
    }
  })
}

/**
 * Limpiar todos los cambios pendientes sincronizados
 */
export async function clearSyncedChanges() {
  await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const changes = request.result.filter(c => c.synced)
      const deleteTransaction = db.transaction([STORE_NAME], 'readwrite')
      const deleteStore = deleteTransaction.objectStore(STORE_NAME)

      changes.forEach(change => {
        deleteStore.delete(change.id)
      })

      deleteTransaction.onerror = () => reject(deleteTransaction.error)
      deleteTransaction.oncomplete = () => {
        console.log(`Limpiados ${changes.length} cambios sincronizados`)
        resolve()
      }
    }

    request.onerror = () => reject(request.error)
  })
}

export default {
  initDB,
  savePendingChange,
  getPendingChanges,
  markAsSynced,
  deletePendingChange,
  clearSyncedChanges,
}
