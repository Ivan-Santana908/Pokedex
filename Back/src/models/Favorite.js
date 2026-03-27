import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pokemonId: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    pokemonName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    types: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  { timestamps: true }
)

favoriteSchema.index({ user: 1, pokemonId: 1 }, { unique: true })

const Favorite = mongoose.model('Favorite', favoriteSchema)

export default Favorite
