const TYPE_CHART = {
  normal: { strong: [], weak: ['rock', 'steel'], immune: ['ghost'] },
  fire: { strong: ['grass', 'ice', 'bug', 'steel'], weak: ['fire', 'water', 'rock', 'dragon'], immune: [] },
  water: { strong: ['fire', 'ground', 'rock'], weak: ['water', 'grass', 'dragon'], immune: [] },
  electric: { strong: ['water', 'flying'], weak: ['electric', 'grass', 'dragon'], immune: ['ground'] },
  grass: { strong: ['water', 'ground', 'rock'], weak: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'], immune: [] },
  ice: { strong: ['grass', 'ground', 'flying', 'dragon'], weak: ['fire', 'water', 'ice', 'steel'], immune: [] },
  fighting: { strong: ['normal', 'ice', 'rock', 'dark', 'steel'], weak: ['poison', 'flying', 'psychic', 'bug', 'fairy'], immune: ['ghost'] },
  poison: { strong: ['grass', 'fairy'], weak: ['poison', 'ground', 'rock', 'ghost'], immune: ['steel'] },
  ground: { strong: ['fire', 'electric', 'poison', 'rock', 'steel'], weak: ['grass', 'bug'], immune: ['flying'] },
  flying: { strong: ['grass', 'fighting', 'bug'], weak: ['electric', 'rock', 'steel'], immune: [] },
  psychic: { strong: ['fighting', 'poison'], weak: ['psychic', 'steel'], immune: ['dark'] },
  bug: { strong: ['grass', 'psychic', 'dark'], weak: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'], immune: [] },
  rock: { strong: ['fire', 'ice', 'flying', 'bug'], weak: ['fighting', 'ground', 'steel'], immune: [] },
  ghost: { strong: ['psychic', 'ghost'], weak: ['dark'], immune: ['normal'] },
  dragon: { strong: ['dragon'], weak: ['steel'], immune: ['fairy'] },
  dark: { strong: ['psychic', 'ghost'], weak: ['fighting', 'dark', 'fairy'], immune: [] },
  steel: { strong: ['ice', 'rock', 'fairy'], weak: ['fire', 'water', 'electric', 'steel'], immune: [] },
  fairy: { strong: ['fighting', 'dragon', 'dark'], weak: ['fire', 'poison', 'steel'], immune: [] },
}

function normalizeType(type) {
  return String(type || 'normal').toLowerCase()
}

function getTypeMultiplier(moveType, defenderTypes) {
  const move = TYPE_CHART[normalizeType(moveType)]
  if (!move) return 1

  return defenderTypes.reduce((mult, rawType) => {
    const defenderType = normalizeType(rawType)
    if (move.immune.includes(defenderType)) return mult * 0
    if (move.strong.includes(defenderType)) return mult * 2
    if (move.weak.includes(defenderType)) return mult * 0.5
    return mult
  }, 1)
}

function pickBestMove(attacker, defender) {
  const defenderTypes = defender.types?.length ? defender.types : ['normal']
  const moves = attacker.moves?.length ? attacker.moves : [{ name: 'tackle', type: 'normal', power: 40, category: 'physical', accuracy: 100, pp: 35 }]

  let bestMove = moves[0]
  let bestExpectedDamage = 0

  for (const move of moves) {
    const moveType = normalizeType(move.type)
    const effectiveness = getTypeMultiplier(moveType, defenderTypes)
    const basePower = Number(move.power) || 40
    const acc = Number(move.accuracy) || 100
    const expected = basePower * effectiveness * (acc / 100)

    if (expected > bestExpectedDamage) {
      bestExpectedDamage = expected
      bestMove = move
    }
  }

  return bestMove
}

function calculateDamage(attacker, defender, move) {
  const level = Number(attacker.level || 50)
  const isSpecial = move.category === 'special'
  const attackStat = isSpecial ? attacker.stats.specialAttack : attacker.stats.attack
  const defenseStat = isSpecial ? defender.stats.specialDefense : defender.stats.defense
  const power = Number(move.power) || 40
  const moveType = normalizeType(move.type)
  const stab = attacker.types?.map(normalizeType).includes(moveType) ? 1.5 : 1
  const effectiveness = getTypeMultiplier(moveType, defender.types || ['normal'])
  const randomFactor = 0.85 + Math.random() * 0.15

  const base = (((2 * level) / 5 + 2) * power * (attackStat / Math.max(1, defenseStat))) / 50 + 2
  const total = Math.max(1, Math.floor(base * stab * effectiveness * randomFactor))

  return { damage: total, effectiveness }
}

function effectivenessMessage(multiplier) {
  if (multiplier === 0) return 'No tuvo efecto.'
  if (multiplier >= 2) return 'Es super efectivo.'
  if (multiplier < 1) return 'No es muy efectivo.'
  return 'Golpe normal.'
}

function cloneTeam(teamMembers, ownerUid) {
  return teamMembers.map((member) => ({
    ownerUid,
    pokemonName: member.pokemonName,
    level: member.level,
    types: member.types,
    moves: member.moves,
    stats: member.stats,
    currentHp: member.stats.hp,
    fainted: false,
  }))
}

function nextAliveIndex(team, startIndex) {
  for (let i = startIndex; i < team.length; i += 1) {
    if (!team[i].fainted) return i
  }
  return -1
}

export function simulateBattle({ challengerUid, opponentUid, challengerMembers, opponentMembers }) {
  const maxTurns = 200
  const turns = []

  const challengerTeam = cloneTeam(challengerMembers, challengerUid)
  const opponentTeam = cloneTeam(opponentMembers, opponentUid)

  let cIndex = 0
  let oIndex = 0

  for (let t = 0; t < maxTurns; t += 1) {
    cIndex = nextAliveIndex(challengerTeam, cIndex)
    oIndex = nextAliveIndex(opponentTeam, oIndex)

    if (cIndex === -1 || oIndex === -1) break

    const challengerPokemon = challengerTeam[cIndex]
    const opponentPokemon = opponentTeam[oIndex]

    const challengerGoesFirst = challengerPokemon.stats.speed >= opponentPokemon.stats.speed
    const order = challengerGoesFirst
      ? [
          { attacker: challengerPokemon, defender: opponentPokemon, attackerUid: challengerUid, defenderUid: opponentUid },
          { attacker: opponentPokemon, defender: challengerPokemon, attackerUid: opponentUid, defenderUid: challengerUid },
        ]
      : [
          { attacker: opponentPokemon, defender: challengerPokemon, attackerUid: opponentUid, defenderUid: challengerUid },
          { attacker: challengerPokemon, defender: opponentPokemon, attackerUid: challengerUid, defenderUid: opponentUid },
        ]

    for (const turnState of order) {
      if (turnState.attacker.fainted || turnState.defender.fainted) continue

      const move = pickBestMove(turnState.attacker, turnState.defender)
      const { damage, effectiveness } = calculateDamage(turnState.attacker, turnState.defender, move)

      turnState.defender.currentHp = Math.max(0, turnState.defender.currentHp - damage)
      if (turnState.defender.currentHp === 0) {
        turnState.defender.fainted = true
      }

      const message = `${turnState.attacker.pokemonName} used ${move.name}. ${effectivenessMessage(effectiveness)}`

      turns.push({
        attackerUid: turnState.attackerUid,
        defenderUid: turnState.defenderUid,
        attackerPokemon: turnState.attacker.pokemonName,
        defenderPokemon: turnState.defender.pokemonName,
        moveName: move.name,
        damage,
        effectiveness,
        defenderRemainingHp: turnState.defender.currentHp,
        message,
      })
    }
  }

  const challengerAlive = challengerTeam.some((p) => !p.fainted)
  const opponentAlive = opponentTeam.some((p) => !p.fainted)

  let winnerUid = null
  if (challengerAlive && !opponentAlive) winnerUid = challengerUid
  if (!challengerAlive && opponentAlive) winnerUid = opponentUid

  const summary =
    winnerUid === challengerUid
      ? 'Challenger won the battle.'
      : winnerUid === opponentUid
      ? 'Opponent won the battle.'
      : 'Battle ended in a draw.'

  return {
    turns,
    winnerUid,
    summary,
  }
}

export default { simulateBattle }
