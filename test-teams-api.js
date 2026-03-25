// Script para probar la API de equipos
import axios from 'axios'

const BASE_URL = 'http://localhost:3000/api'

// Token de prueba -  deberías obtener este de tu sesión en el navegador
const testToken = process.argv[2] || ''

if (!testToken) {
  console.log('Uso: node test-teams-api.js <token>')
  console.log('Para obtener el token, abre la consola del navegador y corre: localStorage.getItem("pokedexAuthToken")')
  process.exit(1)
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${testToken}`,
    'Content-Type': 'application/json'
  }
})

async function testTeamsAPI() {
  try {
    console.log('🧪 Probando API de Equipos...\n')

    // 1. Listar equipos existentes
    console.log('1️⃣ GET /teams - Listar equipos')
    const listResponse = await api.get('/teams')
    console.log('Response:', JSON.stringify(listResponse.data, null, 2))
    console.log()

    // 2. Crear un nuevo equipo
    console.log('2️⃣ POST /teams - Crear nuevo equipo')
    const newTeamPayload = {
      name: 'Test Team ' + new Date().getTime(),
      members: [
        {
          pokemonId: 1,
          pokemonName: 'bulbasaur',
          level: 50,
          types: ['grass', 'poison'],
          spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
          stats: {
            hp: 45,
            attack: 49,
            defense: 49,
            specialAttack: 65,
            specialDefense: 65,
            speed: 45
          },
          moves: [
            { name: 'vine-whip', type: 'grass', category: 'physical', power: 45, accuracy: 100, pp: 25 },
            { name: 'growth', type: 'normal', category: 'status', power: 0, accuracy: 100, pp: 20 }
          ]
        }
      ]
    }

    const createResponse = await api.post('/teams', newTeamPayload)
    console.log('Response:', JSON.stringify(createResponse.data, null, 2))
    const teamId = createResponse.data.team._id
    console.log()

    // 3. Obtener equipos nuevamente
    console.log('3️⃣ GET /teams - Listar equipos (después de crear)')
    const listResponse2 = await api.get('/teams')
    console.log('Response:', JSON.stringify(listResponse2.data, null, 2))
    console.log()

    console.log('✅ Todas las pruebas completadas exitosamente')

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message)
    process.exit(1)
  }
}

testTeamsAPI()
