import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    notificationPreferences: {
      pushEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
)

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    uid: this.uid,
    username: this.username,
    email: this.email,
    displayName: this.displayName,
    friendsCount: this.friends?.length || 0,
    createdAt: this.createdAt,
  }
}

const User = mongoose.model('User', userSchema)

export default User
