"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Heart, MessageCircle, Share, MoreHorizontal, Users, Bookmark } from "lucide-react"
import { usePostStore } from "../store/postStore"
import { useAuthStore } from "../store/authStore"
import PostComposer from "../components/PostComposer"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const Feed = () => {
  const { posts, loading, hasMore, loadFeed, likePost, deletePost, loadPostLikes, postLikes, joinPost } = usePostStore()
  const { user, setUser } = useAuthStore()
  const [page, setPage] = useState(1)
  const [showLikesModal, setShowLikesModal] = useState(null)
  const [saving, setSaving] = useState("")

  useEffect(() => {
    loadFeed(1, true)
  }, [loadFeed])

  useEffect(() => {
    posts.forEach((post) => {
      joinPost(post._id)
    })
  }, [posts, joinPost])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadFeed(nextPage, false)
    }
  }

  const handleLike = async (postId) => {
    await likePost(postId)
  }

  const handleDelete = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      await deletePost(postId)
    }
  }

  const handleShowLikes = async (postId) => {
    await loadPostLikes(postId)
    setShowLikesModal(postId)
  }

  const handleSavePost = async (postId) => {
    setSaving(postId)
    try {
      const res = await fetch(`${API_URL}/users/save-post/${postId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      let data
      try {
        data = await res.json()
      } catch (jsonErr) {
        console.error("Failed to parse JSON:", jsonErr)
        const text = await res.text()
        console.error("Raw response text:", text)
        alert(`Failed to parse server response. Status: ${res.status}. Raw: ${text}`)
        return
      }
      if (!res.ok) {
        console.error("API error:", data)
        alert(`Error: ${data?.message || 'Unknown error'} (Status: ${res.status})`)
        return
      }
      setUser((prev) => ({ ...prev, savedPosts: data.savedPosts }))
    } catch (err) {
      console.error("Network or unexpected error:", err)
      alert(`Network or unexpected error: ${err.message}`)
    } finally {
      setSaving("")
    }
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

  return (
    <div className="space-y-6">
      {/* Post Composer */}
      <PostComposer />

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post._id} className="card bg-base-100 shadow-lg border border-base-300">
            <div className="card-body">
              {/* Post Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Link to={`/profile/${post.author._id}`} className="avatar">
                    <div className="w-10 h-10 rounded-full">
                      <img
                        src={post.author.avatarUrl || "/placeholder.svg?height=40&width=40"}
                        alt={post.author.name}
                      />
                    </div>
                  </Link>
                  <div>
                    <Link to={`/profile/${post.author._id}`} className="font-semibold hover:link">
                      {post.author.name}
                    </Link>
                    <div className="text-sm text-base-content/60">
                      {post.author.batch} • {post.author.center} • {formatDate(post.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Post Menu */}
                {post.author._id === user?.id && (
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm">
                      <MoreHorizontal size={16} />
                    </label>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu p-2 shadow-xl bg-base-100 border border-base-300 rounded-box w-32 z-50"
                    >
                      <li>
                        <button onClick={() => handleDelete(post._id)} className="text-error">
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="mt-4">
                <div
                  className="prose max-w-none text-base-content whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Media - Always show in feed with standardized sizing */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="mt-4">
                    {post.mediaUrls.length === 1 ? (
                      <div className="relative">
                        {post.mediaUrls[0].includes(".mp4") ||
                        post.mediaUrls[0].includes(".mov") ||
                        post.mediaUrls[0].includes(".avi") ? (
                          <video
                            src={post.mediaUrls[0]}
                            controls
                            className="w-full h-80 object-cover rounded-lg border border-base-300"
                          />
                        ) : (
                          <img
                            src={post.mediaUrls[0] || "/placeholder.svg"}
                            alt="Post media"
                            className="w-full h-80 object-cover rounded-lg border border-base-300 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(post.mediaUrls[0], "_blank")}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {post.mediaUrls.slice(0, 4).map((url, index) => (
                          <div key={index} className="relative">
                            {url.includes(".mp4") || url.includes(".mov") || url.includes(".avi") ? (
                              <video
                                src={url}
                                controls
                                className="w-full h-40 object-cover rounded-lg border border-base-300"
                              />
                            ) : (
                              <img
                                src={url || "/placeholder.svg"}
                                alt={`Post media ${index + 1}`}
                                className="w-full h-40 object-cover rounded-lg border border-base-300 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(url, "_blank")}
                              />
                            )}
                            {post.mediaUrls.length > 4 && index === 3 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                <span className="text-white font-semibold">+{post.mediaUrls.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-300">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center space-x-2 btn btn-ghost btn-sm ${post.isLiked ? "text-error" : ""}`}
                  >
                    <Heart size={18} className={post.isLiked ? "fill-current" : ""} />
                    <span>{post.likesCount || 0}</span>
                  </button>

                  {post.likesCount > 0 && (
                    <button
                      onClick={() => handleShowLikes(post._id)}
                      className="flex items-center space-x-1 btn btn-ghost btn-sm text-base-content/60"
                    >
                      <Users size={16} />
                    </button>
                  )}

                  <Link to={`/post/${post._id}`} className="flex items-center space-x-2 btn btn-ghost btn-sm">
                    <MessageCircle size={18} />
                    <span>{post.commentsCount || 0}</span>
                  </Link>

                  <button
                    onClick={() => handleSavePost(post._id)}
                    className={`flex items-center space-x-2 btn btn-ghost btn-sm ${user?.savedPosts?.includes(post._id) ? "text-primary" : ""}`}
                    disabled={saving === post._id}
                    title={user?.savedPosts?.includes(post._id) ? "Unsave" : "Save"}
                  >
                    <Bookmark size={18} className={user?.savedPosts?.includes(post._id) ? "fill-current" : ""} />
                    <span>{user?.savedPosts?.includes(post._id) ? "Saved" : "Save"}</span>
                  </button>

                  <button className="flex items-center space-x-2 btn btn-ghost btn-sm">
                    <Share size={18} />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Load More */}
        {!loading && hasMore && (
          <div className="flex justify-center">
            <button onClick={handleLoadMore} className="btn btn-outline">
              Load More Posts
            </button>
          </div>
        )}

        {/* No more posts */}
        {!loading && !hasMore && posts.length > 0 && (
          <div className="text-center py-8 text-base-content/60">You've reached the end of the feed</div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-base-content/60 mb-4">No posts yet. Be the first to share something!</div>
          </div>
        )}
      </div>

      {/* Likes Modal */}
      {showLikesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden border border-base-300">
            <div className="p-4 border-b border-base-300 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Liked by</h3>
              <button onClick={() => setShowLikesModal(null)} className="btn btn-ghost btn-sm">
                &times;
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              {postLikes.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  className="flex items-center space-x-3 p-2 hover:bg-base-200 rounded-lg border border-base-300 mb-2"
                  onClick={() => setShowLikesModal(null)}
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

export default Feed
