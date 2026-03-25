import mongoose from 'mongoose'

const moveSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true, lowercase: true },
    category: {
      type: String,
      enum: ['physical', 'special', 'status'],
      default: 'physical',
    },
    power: { type: Number, default: 40, min: 0 },
    accuracy: { type: Number, default: 100, min: 1, max: 100 },
    pp: { type: Number, default: 35, min: 1 },
  },
  { _id: false }
)

const pokemonInTeamSchema = new mongoose.Schema(
  {
    pokemonId: { type: Number, required: true },
    pokemonName: { type: String, required: true, trim: true, lowercase: true },
    level: { type: Number, default: 50, min: 1, max: 100 },
    types: [{ type: String, trim: true, lowercase: true }],
    stats: {
      hp: { type: Number, required: true },
      attack: { type: Number, required: true },
      defense: { type: Number, required: true },
      specialAttack: { type: Number, required: true },
      specialDefense: { type: Number, required: true },
      speed: { type: Number, required: true },
    },
    moves: {
      type: [moveSchema],
      validate: {
        validator: (moves) => moves.length > 0 && moves.length <= 4,
        message: 'Each pokemon must have between 1 and 4 moves',
      },
    },
  },
  { _id: false }
)

const teamSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    members: {
      type: [pokemonInTeamSchema],
      validate: {
        validator: (members) => members.length > 0 && members.length <= 6,
        message: 'A team must have between 1 and 6 pokemon',
      },
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

const Team = mongoose.model('Team', teamSchema)

export default Team
