import mongoose from 'mongoose'

const battleTurnSchema = new mongoose.Schema(
  {
    attackerUid: { type: String, required: true },
    defenderUid: { type: String, required: true },
    attackerPokemon: { type: String, required: true },
    defenderPokemon: { type: String, required: true },
    moveName: { type: String, required: true },
    damage: { type: Number, required: true },
    effectiveness: { type: Number, required: true },
    defenderRemainingHp: { type: Number, required: true },
    message: { type: String, required: true },
  },
  { _id: false }
)

const battleSchema = new mongoose.Schema(
  {
    challenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    opponent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    challengerTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    opponentTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'finished', 'cancelled'],
      default: 'pending',
      index: true,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    turns: {
      type: [battleTurnSchema],
      default: [],
    },
    battleState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    summary: {
      type: String,
      default: '',
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

const Battle = mongoose.model('Battle', battleSchema)

export default Battle
