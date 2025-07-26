const express = require("express")
const Post = require("../models/Post")
const Comment = require("../models/Comment")
const { authenticate } = require("../middleware/auth")
const upload = require("../middleware/upload")

const router = express.Router()

const getIO = (req) => req.app.get('io')

// Create post
router.post("/", authenticate, upload.array("media", 5), async (req, res) => {
  try {
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ message: "Content is required" })
    }

    // Get Cloudinary URLs from uploaded files
    const mediaUrls = req.files ? req.files.map((file) => file.path) : []

    const post = new Post({
      author: req.user._id,
      content,
      mediaUrls,
    })

    await post.save()
    await post.populate("author", "name avatarUrl batch center")

    const io = getIO(req)
    if (io) io.emit('newPost', post)

    res.status(201).json({ post })
  } catch (error) {
    console.error("Create post error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get user's posts
router.get("/user/:id", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const userId = req.params.id

    const posts = await Post.find({ author: userId })
      .populate("author", "name avatarUrl batch center")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Post.countDocuments({ author: userId })

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    })
  } catch (error) {
    console.error("Get user posts error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get feed
router.get("/", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const posts = await Post.find()
      .populate("author", "name avatarUrl batch center")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    // Add isLiked field for current user
    const postsWithLikeStatus = posts.map((post) => ({
      ...post.toObject(),
      isLiked: post.likes.includes(req.user._id),
    }))

    const total = await Post.countDocuments()

    res.json({
      posts: postsWithLikeStatus,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    })
  } catch (error) {
    console.error("Get feed error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get single post with comments
router.get("/:id", authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name avatarUrl batch center")

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    // Get top-level comments with their replies
    const comments = await Comment.find({ postId: req.params.id, parentComment: null })
      .populate("author", "name avatarUrl")
      .sort({ createdAt: 1 })

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate("author", "name avatarUrl")
          .sort({ createdAt: 1 })

        const repliesWithLikeStatus = replies.map((reply) => ({
          ...reply.toObject(),
          isLiked: reply.likes.includes(req.user._id),
        }))

        return {
          ...comment.toObject(),
          isLiked: comment.likes.includes(req.user._id),
          replies: repliesWithLikeStatus,
        }
      }),
    )

    const postWithLikeStatus = {
      ...post.toObject(),
      isLiked: post.likes.includes(req.user._id),
    }

    res.json({ post: postWithLikeStatus, comments: commentsWithReplies })
  } catch (error) {
    console.error("Get post error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get post likes
router.get("/:id/likes", authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("likes", "name avatarUrl batch center")

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    res.json({ likes: post.likes })
  } catch (error) {
    console.error("Get post likes error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete post
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    await Post.findByIdAndDelete(req.params.id)
    await Comment.deleteMany({ postId: req.params.id })

    res.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Delete post error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Like/Unlike post
router.post("/:id/like", authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    const isLiked = post.likes.includes(req.user._id)

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString())
    } else {
      post.likes.push(req.user._id)
    }

    await post.save()

    res.json({
      liked: !isLiked,
      likesCount: post.likesCount,
      likedUserIds: post.likes.map((id) => id.toString()),
    })
  } catch (error) {
    console.error("Like post error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Add comment
router.post("/:id/comments", authenticate, async (req, res) => {
  try {
    const { text, parentComment = null } = req.body

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" })
    }

    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ message: "Post not found" })
    }

    const comment = new Comment({
      postId: req.params.id,
      author: req.user._id,
      text,
      parentComment,
    })

    await comment.save()
    await comment.populate("author", "name avatarUrl")

    // Update comments count only for top-level comments
    if (!parentComment) {
      post.commentsCount += 1
      await post.save()
    }

    const io = getIO(req)
    if (io) io.to(`post:${req.params.id}`).emit('newComment', { comment, parentComment })

    res.status(201).json({ comment })
  } catch (error) {
    console.error("Add comment error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Edit comment
router.put("/comments/:id", authenticate, async (req, res) => {
  try {
    const { text } = req.body
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    comment.text = text
    comment.isEdited = true
    comment.editedAt = new Date()
    await comment.save()

    await comment.populate("author", "name avatarUrl")

    // Emit real-time event for comment edit
    const io = getIO(req)
    if (io) io.to(`post:${comment.postId}`).emit('commentEdited', { comment })

    res.json({ comment })
  } catch (error) {
    console.error("Edit comment error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Like/Unlike comment
router.post("/comments/:id/like", authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    const isLiked = comment.likes.includes(req.user._id)

    if (isLiked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== req.user._id.toString())
    } else {
      comment.likes.push(req.user._id)
    }

    await comment.save()

    // Return the list of user IDs who liked the comment
    res.json({
      liked: !isLiked,
      likesCount: comment.likesCount,
      likedUserIds: comment.likes.map((id) => id.toString()),
    })
  } catch (error) {
    console.error("Like comment error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get comment likes
router.get("/comments/:id/likes", authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate("likes", "name avatarUrl batch center")

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    res.json({ likes: comment.likes })
  } catch (error) {
    console.error("Get comment likes error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete comment
router.delete("/comments/:id", authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    // Check if user is comment author or post author
    const post = await Post.findById(comment.postId)
    const canDelete =
      comment.author.toString() === req.user._id.toString() || post.author.toString() === req.user._id.toString()

    if (!canDelete) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: comment._id })

    await Comment.findByIdAndDelete(req.params.id)

    // Update comments count only for top-level comments
    if (!comment.parentComment) {
      post.commentsCount -= 1
      await post.save()
    }

    // Emit real-time event for comment deletion
    const io = getIO(req)
    if (io) io.to(`post:${comment.postId}`).emit('commentDeleted', { commentId: comment._id, parentComment: comment.parentComment })

    res.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Delete comment error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
