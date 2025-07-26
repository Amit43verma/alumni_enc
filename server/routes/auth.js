const express = require("express")
const jwt = require("jsonwebtoken")
const { OAuth2Client } = require("google-auth-library")
const otpGenerator = require("otp-generator")
const User = require("../models/User")
const PendingUser = require("../models/PendingUser")
const sendEmail = require("../utils/email")
const { authenticate } = require("../middleware/auth")

const router = express.Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, batch, center } = req.body

    // Validate required fields
    if (!name || !password || !batch || !center) {
      return res
        .status(400)
        .json({ message: "Name, password, batch, and center are required" })
    }

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email is required for verification" })
    }

    // Check if user already exists and is verified
    let existingUser = await User.findOne({ email })
    if (existingUser && existingUser.isVerified) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" })
    }

    // Remove any previous pending user for this email
    await PendingUser.deleteOne({ email })

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    })
    const otpExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Store pending user
    const pendingUser = new PendingUser({
      name,
      email,
      password,
      batch,
      center,
      otp,
      otpExpires,
    })
    await pendingUser.save()

    try {
      await sendEmail({
        email: pendingUser.email,
        subject: "Verify your email for Alumni Portal",
        html: `<p>Your OTP for email verification is: <h1>${otp}</h1> It is valid for 10 minutes.</p>`,
      })
    } catch (emailError) {
      console.error("Email sending error:", emailError)
      return res
        .status(500)
        .json({ message: "Error sending verification email. Please try again." })
    }

    res.status(201).json({
      message: "OTP sent to your email. Please verify to complete registration.",
      email: pendingUser.email,
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ message: error.message || "Server error" })
  }
})

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" })
    }

    // Find pending user
    const pendingUser = await PendingUser.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() },
    })

    if (!pendingUser) {
      return res.status(400).json({ message: "Invalid or expired OTP" })
    }

    // Check if user already exists and is verified (shouldn't happen, but for safety)
    let existingUser = await User.findOne({ email })
    if (existingUser && existingUser.isVerified) {
      await PendingUser.deleteOne({ email })
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Create user in main User collection
    const user = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      batch: pendingUser.batch,
      center: pendingUser.center,
      isVerified: true,
    })
    await user.save()

    // Remove pending user
    await PendingUser.deleteOne({ email })

    const token = generateToken(user._id)

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        batch: user.batch,
        center: user.center,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    console.error("OTP verification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "User not found" })
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" })
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    })
    const otpExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

    user.otp = otp
    user.otpExpires = otpExpires
    await user.save({ validateBeforeSave: false })

    try {
      await sendEmail({
        email: user.email,
        subject: "Resend: Verify your email for Alumni Portal",
        html: `<p>Your new OTP for email verification is: <h1>${otp}</h1> It is valid for 10 minutes.</p>`,
      })
    } catch (emailError) {
      console.error("Email sending error:", emailError)
      return res
        .status(500)
        .json({ message: "Error sending verification email. Please try again." })
    }

    res.status(200).json({ message: "New OTP sent to your email." })
  } catch (error) {
    console.error("Resend OTP error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body // identifier is now only email

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    // Find user by email only
    const user = await User.findOne({ email: identifier })

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Email not verified. Please verify your email first.",
        notVerified: true,
        email: user.email,
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = generateToken(user._id)

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        batch: user.batch,
        center: user.center,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Google OAuth
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload

    let user = await User.findOne({ googleId })

    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email })

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId
        if (!user.avatarUrl) user.avatarUrl = picture
        await user.save()
      } else {
        // Create new user - but require additional info
        return res.status(400).json({
          message: "Additional information required",
          needsRegistration: true,
          googleData: { googleId, email, name, picture },
        })
      }
    }

    const token = generateToken(user._id)

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        batch: user.batch,
        center: user.center,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    console.error("Google auth error:", error)
    res.status(500).json({ message: "Google authentication failed" })
  }
})

// Complete Google registration
router.post("/google/complete", async (req, res) => {
  try {
    const { googleId, email, name, picture, batch, center, phone } = req.body

    if (!batch || !center) {
      return res.status(400).json({ message: "Batch and center are required" })
    }

    const user = new User({
      name,
      email,
      phone,
      googleId,
      batch,
      center,
      avatarUrl: picture || "",
    })

    await user.save()

    const token = generateToken(user._id)

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        batch: user.batch,
        center: user.center,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    console.error("Google registration completion error:", error)
    res.status(500).json({ message: "Registration completion failed" })
  }
})

// Get current user
router.get("/me", authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      batch: req.user.batch,
      center: req.user.center,
      avatarUrl: req.user.avatarUrl,
      bio: req.user.bio,
      skills: req.user.skills,
      socialLinks: req.user.socialLinks,
    },
  })
})

// Forgot Password - send OTP to email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });
    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP for Alumni Portal",
        html: `<p>Your OTP for password reset is: <h1>${otp}</h1> It is valid for 10 minutes.</p>`,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return res.status(500).json({ message: "Error sending OTP email. Please try again." });
    }
    res.status(200).json({ message: "OTP sent to your email for password reset." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset Password - verify OTP and set new password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }
    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router
