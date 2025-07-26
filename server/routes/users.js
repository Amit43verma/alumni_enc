const express = require("express")
const User = require("../models/User")
const { authenticate } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()

// Add these two new routes for encryption key management
// 1. Upload a public key for the logged-in user
router.post("/keys/upload", authenticate, async (req, res) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey) {
      return res.status(400).json({ message: "Public key is required." });
    }
    await User.findByIdAndUpdate(req.user._id, { publicKey });
    res.status(200).json({ message: "Public key saved successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error while saving public key." });
  }
});

// 2. Get the public key of another user
router.get("/keys/:userId", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("publicKey");
    if (!user || !user.publicKey) {
      return res.status(404).json({ message: "User or public key not found." });
    }
    res.status(200).json({ publicKey: user.publicKey });
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching public key." });
  }
});


//encryption key management routes end here




// Get all saved posts for the logged-in user
router.get("/saved-posts", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "savedPosts",
      populate: { path: "author", select: "name avatarUrl" },
    })
    res.json({ savedPosts: user.savedPosts })
  } catch (error) {
    console.error("Get saved posts error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all batches and centers for filters
router.get("/meta/options", authenticate, async (req, res) => {
  try {
    const batches = await User.distinct("batch")
    const centers = await User.distinct("center")

    res.json({ batches, centers })
  } catch (error) {
    console.error("Get meta options error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Search users
router.get("/", authenticate, async (req, res) => {
  try {
    const { name, batch, center, page = 1, limit = 10 } = req.query

    const query = { _id: { $ne: req.user._id } } // Exclude current user
    if (name) {
      query.name = { $regex: name, $options: "i" }
    }
    if (batch) query.batch = batch
    if (center) query.center = center

    const users = await User.find(query)
      .select("name email batch center avatarUrl bio")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 })

    const total = await User.countDocuments(query)

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    })
  } catch (error) {
    console.error("Search users error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Save or unsave a post
router.post("/save-post/:postId", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;

    // Check if already saved
    const user = await User.findById(userId);
    const isSaved = user.savedPosts.includes(postId);

    let update;
    let action;
    if (!isSaved) {
      update = { $addToSet: { savedPosts: postId } };
      action = "saved";
    } else {
      update = { $pull: { savedPosts: postId } };
      action = "unsaved";
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true }).select("savedPosts");
    res.json({ message: `Post ${action} successfully`, savedPosts: updatedUser.savedPosts });
  } catch (error) {
    console.error("Save/Unsave post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile
router.get("/:id", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update user profile
router.put("/:id", authenticate, upload.single("avatar"), async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    const updates = req.body

    // Handle avatar upload
    if (req.file) {
      updates.avatarUrl = req.file.path // Cloudinary URL
    }

    // If phone is an empty string, set to null
    // if (typeof updates.phone === "string" && updates.phone.trim() === "") {
    //   updates.phone = null;
    // }




     if (typeof updates.phone === "string" && updates.phone.trim() === "") {
      // Instead of setting to null, we remove the field so MongoDB won't index it
      delete updates.phone; 
      
      // We also need to explicitly tell Mongoose to unset the field in the database
      // in case a `null` value already exists from a previous failed attempt.
      const user = await User.findById(req.params.id);
      if (user && user.phone !== undefined) {
          await User.findByIdAndUpdate(req.params.id, { $unset: { phone: 1 } });
      }
    }


    
    // Parse experiences if it's a string
    if (updates.experiences && typeof updates.experiences === "string") {
      updates.experiences = JSON.parse(updates.experiences)
    }

    // Remove 'id' and ensure '_id' is a string for experiences
    if (Array.isArray(updates.experiences)) {
      updates.experiences = updates.experiences.map(exp => {
        const { id, ...rest } = exp;
        if (rest._id && typeof rest._id !== 'string') {
          delete rest._id;
        }
        return rest;
      });
    }

    // Parse skills if it's a string
    if (updates.skills && typeof updates.skills === "string") {
      updates.skills = JSON.parse(updates.skills)
    }

    // Parse socialLinks if it's a string
    if (updates.socialLinks && typeof updates.socialLinks === "string") {
      updates.socialLinks = JSON.parse(updates.socialLinks)
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select(
      "-passwordHash",
    )

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ message: error.message || "Server error" })
  }
})

module.exports = router
