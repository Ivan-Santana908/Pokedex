# Pokedex Backend

Backend en Express para la aplicación Pokedex. Proporciona API para buscar y gestionar información de Pokémon.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3000`

## Producción

```bash
npm start
```

## Endpoints

### Pokémon

- `GET /api/pokemon` - Lista de pokémon con paginación
  - `?offset=0&limit=20`

- `GET /api/pokemon/all` - Obtener todos los pokémon
  - `?limit=100000`

- `GET /api/pokemon/:nameOrId` - Detalles de un pokémon específico
  - Ejemplo: `/api/pokemon/pikachu` o `/api/pokemon/25`

- `GET /api/pokemon/search?query=pikachu` - Buscar pokémon
  - Incluye sugerencias si no encuentra coincidencia exacta

- `GET /api/pokemon/types` - Obtener tipos

- `GET /api/pokemon/type/:type` - Pokémon por tipo
  - Ejemplo: `/api/pokemon/type/fire`

## Variables de Entorno

Crear archivo `.env` con:

```
PORT=3000
NODE_ENV=development
API_URL=https://pokeapi.co/api/v2
CORS_ORIGIN=http://localhost:5173
```

## Características

- ✅ API caché (5 minutos)
- ✅ Búsqueda con sugerencias (Levenshtein)
- ✅ CORS configurable
- ✅ Manejo de errores centralizado
- ✅ Health check endpoint
