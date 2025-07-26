const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 500,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
  },
  {
    timestamps: true,
  },
)

// Update counts when likes change
commentSchema.pre("save", function (next) {
  this.likesCount = this.likes.length
  next()
})

// Update parent comment's reply count when a reply is added/removed
commentSchema.post("save", async function () {
  if (this.parentComment) {
    const Comment = this.constructor
    const replyCount = await Comment.countDocuments({ parentComment: this.parentComment })
    await Comment.findByIdAndUpdate(this.parentComment, { repliesCount: replyCount })
  }
})

commentSchema.post("remove", async function () {
  if (this.parentComment) {
    const Comment = this.constructor
    const replyCount = await Comment.countDocuments({ parentComment: this.parentComment })
    await Comment.findByIdAndUpdate(this.parentComment, { repliesCount: replyCount })
  }
})

module.exports = mongoose.model("Comment", commentSchema)
