const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const validator = require("validator")

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  from: { type: Date, required: true },
  to: { type: Date },
  current: { type: Boolean, default: false },
  description: String,
})

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    googleId: String,
    batch: {
      type: String,
      required: true,
    },
    center: {
      type: String,
      required: true,
    },
    graduationYear: {
      type: Number,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    experiences: [experienceSchema],
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    skills: [String],
    socialLinks: {
      linkedin: String,
      github: String,
      twitter: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      default: null,
    },
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    publicKey: { // Add this field
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password)
}

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

module.exports = mongoose.model("User", userSchema)
