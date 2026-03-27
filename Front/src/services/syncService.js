/**
 * Servicio para sincronizar cambios pendientes con el servidor
 * Se ejecuta automáticamente cuando hay conexión
 */

import axios from 'axios'
import { getBackendUrl } from './apiBaseUrl'
import * as indexedDb from './indexedDbService'

const BACKEND_URL = getBackendUrl()

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
})

function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

/**
 * Sincronizar cambios pendientes con el servidor
 * @param {string} token - Token JWT del usuario
 * @param {Function} onProgress - Callback para reportar progreso (opcional)
 * @returns {Object} { successful: [], failed: [] }
 */
export async function syncPendingChanges(token, onProgress = null) {
  if (!token) {
    console.warn('No hay token para sincronizar')
    return { successful: [], failed: [] }
  }

  if (!navigator.onLine) {
    console.log('Sin conexión - no se puede sincronizar')
    return { successful: [], failed: [] }
  }

  try {
    console.log('Iniciando sincronización de cambios pendientes...')
    const pendingChanges = await indexedDb.getPendingChanges()

    if (pendingChanges.length === 0) {
      console.log('No hay cambios pendientes para sincronizar')
      return { successful: [], failed: [] }
    }

    console.log(`Sincronizando ${pendingChanges.length} cambios pendientes...`)

    const results = { successful: [], failed: [] }

    for (let i = 0; i < pendingChanges.length; i++) {
      const change = pendingChanges[i]

      try {
        if (change.action === 'add') {
          const pokemon = change.pokemon
          const pokemonId = Number(pokemon?.id || 0)
          const pokemonName = String(pokemon?.name || '').trim().toLowerCase()
          const imageUrl =
            pokemon?.sprites?.other?.['official-artwork']?.front_default ||
            pokemon?.sprites?.front_default ||
            ''
          const types = Array.isArray(pokemon?.types)
            ? pokemon.types
                .map((item) => String(item?.type?.name || '').trim().toLowerCase())
                .filter(Boolean)
            : []

          console.log(`Sincronizando: añadir ${pokemon?.name} (ID: ${pokemonId})`)

          await api.post(
            `/favorites/${pokemonId}`,
            { pokemonName, imageUrl, types },
            authHeaders(token)
          )

          results.successful.push(change)
          await indexedDb.deletePendingChange(change.id)
        } else if (change.action === 'remove') {
          console.log(`Sincronizando: remover pokémon ID ${change.pokemonId}`)

          await api.delete(`/favorites/${change.pokemonId}`, authHeaders(token))

          results.successful.push(change)
          await indexedDb.deletePendingChange(change.id)
        }

        if (onProgress) {
          onProgress({
            total: pendingChanges.length,
            done: results.successful.length + results.failed.length,
          })
        }
      } catch (err) {
        console.error(`Error sincronizando cambio ${change.id}:`, err)
        results.failed.push({
          ...change,
          error: err.message || 'Error desconocido',
        })

        if (onProgress) {
          onProgress({
            total: pendingChanges.length,
            done: results.successful.length + results.failed.length,
          })
        }
      }
    }

    console.log(
      `Sincronización completada: ${results.successful.length} exitosos, ${results.failed.length} fallidos`
    )

    // Limpiar cambios sincronizados
    await indexedDb.clearSyncedChanges()

    return results
  } catch (err) {
    console.error('Error en sincronización general:', err)
    return { successful: [], failed: [] }
  }
}

export default {
  syncPendingChanges,
}
