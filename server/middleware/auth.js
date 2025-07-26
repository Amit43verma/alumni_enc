const jwt = require("jsonwebtoken")
const User = require("../models/User")

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-passwordHash")

    if (!user) {
      return res.status(401).json({ message: "Invalid token." })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid token." })
  }
}

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error("Authentication error"))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return next(new Error("Authentication error"))
    }

    socket.userId = user._id.toString()
    next()
  } catch (error) {
    next(new Error("Authentication error"))
  }
}

module.exports = { authenticate, authenticateSocket }
