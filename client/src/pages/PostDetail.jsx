"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Heart, Send, MoreHorizontal, Trash2, Edit, Reply, Users } from "lucide-react"
import { usePostStore } from "../store/postStore"
import { useAuthStore } from "../store/authStore"

const PostDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    currentPost,
    comments,
    postLikes,
    commentLikes,
    loading,
    loadPost,
    likePost,
    addComment,
    editComment,
    likeComment,
    deleteComment,
    deletePost,
    loadPostLikes,
    loadCommentLikes,
    joinPost,
    leavePost,
  } = usePostStore()

  const [commentText, setCommentText] = useState("")
  const [replyTexts, setReplyTexts] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPostLikes, setShowPostLikes] = useState(false)
  const [showCommentLikes, setShowCommentLikes] = useState(null)
  const [expandedReplies, setExpandedReplies] = useState(new Set())

  useEffect(() => {
    if (id) {
      loadPost(id)
      joinPost(id)
    }

    return () => {
      if (id) {
        leavePost(id)
      }
    }
  }, [id, loadPost, joinPost, leavePost])

  const handleLike = async () => {
    if (currentPost) {
      await likePost(currentPost._id)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    setIsSubmitting(true)
    const result = await addComment(id, commentText)
    if (result.success) {
      setCommentText("")
    }
    setIsSubmitting(false)
  }

  const handleSubmitReply = async (e, parentCommentId) => {
    e.preventDefault()
    if (!replyTexts[parentCommentId]?.trim()) return

    setIsSubmitting(true)
    const result = await addComment(id, replyTexts[parentCommentId], parentCommentId)
    if (result.success) {
      setReplyTexts((prev) => ({ ...prev, [parentCommentId]: "" }))
      setReplyingTo(null)
      setExpandedReplies((prev) => new Set([...prev, parentCommentId]))
    }
    setIsSubmitting(false)
  }

  const handleDeleteComment = async (commentId, parentComment = null) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      await deleteComment(commentId, id, parentComment)
    }
  }

  const handleDeletePost = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      await deletePost(id)
      navigate("/feed")
    }
  }

  const handleLikeComment = async (commentId) => {
    await likeComment(commentId)
  }

  const handleShowPostLikes = async () => {
    await loadPostLikes(id)
    setShowPostLikes(true)
  }

  const handleShowCommentLikes = async (commentId) => {
    await loadCommentLikes(commentId)
    setShowCommentLikes(commentId)
  }

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
  }

  const CommentComponent = ({ comment, isReply = false }) => {
    const replyInputRef = useRef(null)
    const [isEditing, setIsEditing] = useState(false)
    const [localEditText, setLocalEditText] = useState(comment.text)

    useEffect(() => {
      setLocalEditText(comment.text)
    }, [comment.text])

    const handleEdit = async () => {
      if (!localEditText.trim()) return
      const result = await editComment(comment._id, localEditText)
      if (result.success) {
        setIsEditing(false)
      }
    }

    return (
      <div className={`${isReply ? "ml-8 border-l-2 border-base-300 pl-4" : ""}`}>
        <div className="flex space-x-3">
          <Link to={`/profile/${comment.author._id}`} className="avatar">
            <div className="w-8 h-8 rounded-full">
              <img src={comment.author.avatarUrl || "/placeholder.svg?height=32&width=32"} alt={comment.author.name} />
            </div>
          </Link>
          <div className="flex-1">
            {isEditing ? (
              <div className="bg-base-200 p-3 rounded-lg">
                <textarea
                  value={localEditText}
                  onChange={(e) => setLocalEditText(e.target.value)}
                  className="textarea textarea-bordered w-full"
                  rows="2"
                  autoFocus
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setLocalEditText(comment.text)
                    }}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                  <button onClick={handleEdit} className="btn btn-primary btn-sm">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-base-200 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <Link to={`/profile/${comment.author._id}`} className="font-semibold hover:link">
                    {comment.author.name}
                  </Link>
                  {comment.author._id === user?.id && (
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-ghost btn-xs">
                        <MoreHorizontal size={14} />
                      </label>
                      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32">
                        <li>
                          <button
                            onClick={() => {
                              setIsEditing(true)
                              setLocalEditText(comment.text)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => handleDeleteComment(comment._id, comment.parentComment)}
                            className="text-error flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                <p className="mt-1">{comment.text}</p>
                {comment.isEdited && <span className="text-xs text-base-content/50">(edited)</span>}
              </div>
            )}

            <div className="flex items-center space-x-4 mt-2 text-sm">
              <button
                onClick={() => handleLikeComment(comment._id)}
                className={`flex items-center space-x-1 hover:text-error ${comment.isLiked ? "text-error" : ""}`}
              >
                <Heart size={14} className={comment.isLiked ? "fill-current" : ""} />
                <span>{comment.likesCount || 0}</span>
              </button>

              {comment.likesCount > 0 && (
                <button
                  onClick={() => handleShowCommentLikes(comment._id)}
                  className="text-base-content/60 hover:text-base-content"
                >
                  View likes
                </button>
              )}

              {!isReply && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                  className="flex items-center space-x-1 text-base-content/60 hover:text-base-content"
                >
                  <Reply size={14} />
                  <span>Reply</span>
                </button>
              )}

              <span className="text-base-content/60">{formatDate(comment.createdAt)}</span>
            </div>

            {/* Reply form */}
            {replyingTo === comment._id && (
              <form onSubmit={(e) => handleSubmitReply(e, comment._id)} className="mt-3">
                <div className="flex items-center space-x-2">
                  <div className="avatar">
                    <div className="w-6 h-6 rounded-full">
                      <img src={user?.avatarUrl || "/placeholder.svg?height=24&width=24"} alt={user?.name} />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={replyTexts[comment._id] || ""}
                    onChange={(e) => setReplyTexts((prev) => ({ ...prev, [comment._id]: e.target.value }))}
                    placeholder="Write a reply..."
                    className="input input-bordered input-sm flex-1"
                    maxLength={500}
                    ref={replyInputRef}
                    autoFocus={replyingTo === comment._id}
                  />
                  <button
                    type="submit"
                    disabled={!replyTexts[comment._id]?.trim() || isSubmitting}
                    className="btn btn-primary btn-sm btn-circle"
                  >
                    {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : <Send size={14} />}
                  </button>
                </div>
              </form>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                <button onClick={() => toggleReplies(comment._id)} className="text-sm text-primary hover:underline">
                  {expandedReplies.has(comment._id)
                    ? "Hide replies"
                    : `Show ${comment.replies.length} ${comment.replies.length === 1 ? "reply" : "replies"}`}
                </button>

                {expandedReplies.has(comment._id) && (
                  <div className="mt-2 space-y-3">
                    {comment.replies.map((reply) => (
                      <CommentComponent key={reply._id} comment={reply} isReply={true} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!currentPost) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold">Post not found</h2>
            <p className="mt-2 text-base-content/60">This post may have been deleted or is unavailable.</p>
            <Link to="/feed" className="btn btn-primary mt-4">
              Back to Feed
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-2">
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* Post card */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          {/* Post Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to={`/profile/${currentPost.author._id}`} className="avatar">
                <div className="w-12 h-12 rounded-full">
                  <img
                    src={currentPost.author.avatarUrl || "/placeholder.svg?height=48&width=48"}
                    alt={currentPost.author.name}
                  />
                </div>
              </Link>
              <div>
                <Link to={`/profile/${currentPost.author._id}`} className="font-semibold hover:link">
                  {currentPost.author.name}
                </Link>
                <div className="text-sm text-base-content/60">
                  {currentPost.author.batch} • {currentPost.author.center}
                </div>
                <div className="text-xs text-base-content/60">{formatDate(currentPost.createdAt)}</div>
              </div>
            </div>

            {/* Post Menu */}
            {currentPost.author._id === user?.id && (
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-sm">
                  <MoreHorizontal size={18} />
                </label>
                <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32">
                  <li>
                    <button onClick={handleDeletePost} className="text-error flex items-center gap-2">
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="mt-4">
            <div dangerouslySetInnerHTML={{ __html: currentPost.content }} />

            {/* Media */}
            {currentPost.mediaUrls && currentPost.mediaUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-2">
                {currentPost.mediaUrls.map((url, index) => (
                  <div key={index} className="relative">
                    {url.includes(".mp4") || url.includes(".mov") || url.includes(".avi") ? (
                      <video
                        src={url}
                        controls
                        className="w-full rounded-lg max-h-[500px] object-contain bg-base-300"
                      />
                    ) : (
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Post media ${index + 1}`}
                        className="w-full rounded-lg max-h-[500px] object-contain bg-base-300"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 btn btn-ghost btn-sm ${
                  currentPost.isLiked ? "text-error" : ""
                }`}
              >
                <Heart size={18} className={currentPost.isLiked ? "fill-current" : ""} />
                <span>{currentPost.likesCount || 0}</span>
              </button>

              {currentPost.likesCount > 0 && (
                <button onClick={handleShowPostLikes} className="flex items-center space-x-2 btn btn-ghost btn-sm">
                  <Users size={18} />
                  <span>View likes</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>

          {/* Comment form */}
          <form onSubmit={handleSubmitComment} className="flex items-center space-x-2 mb-6">
            <div className="avatar">
              <div className="w-8 h-8 rounded-full">
                <img src={user?.avatarUrl || "/placeholder.svg?height=32&width=32"} alt={user?.name} />
              </div>
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="input input-bordered flex-1"
              maxLength={500}
            />
            <button type="submit" disabled={!commentText.trim() || isSubmitting} className="btn btn-primary btn-circle">
              {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : <Send size={18} />}
            </button>
          </form>

          {/* Comments list */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-4 text-base-content/60">No comments yet. Be the first to comment!</div>
            ) : (
              comments.map((comment) => <CommentComponent key={comment._id} comment={comment} />)
            )}
          </div>
        </div>
      </div>

      {/* Post Likes Modal */}
      {showPostLikes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-base-300 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Liked by</h3>
              <button onClick={() => setShowPostLikes(false)} className="btn btn-ghost btn-sm">
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              {postLikes.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  className="flex items-center space-x-3 p-2 hover:bg-base-200 rounded-lg"
                  onClick={() => setShowPostLikes(false)}
                >
                  <div className="avatar">
                    <div className="w-10 h-10 rounded-full">
                      <img src={user.avatarUrl || "/placeholder.svg?height=40&width=40"} alt={user.name} />
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-base-content/60">
                      {user.batch} • {user.center}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comment Likes Modal */}
      {showCommentLikes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-base-300 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Liked by</h3>
              <button onClick={() => setShowCommentLikes(null)} className="btn btn-ghost btn-sm">
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              {commentLikes.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  className="flex items-center space-x-3 p-2 hover:bg-base-200 rounded-lg"
                  onClick={() => setShowCommentLikes(null)}
                >
                  <div className="avatar">
                    <div className="w-10 h-10 rounded-full">
                      <img src={user.avatarUrl || "/placeholder.svg?height=40&width=40"} alt={user.name} />
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-base-content/60">
                      {user.batch} • {user.center}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostDetail
