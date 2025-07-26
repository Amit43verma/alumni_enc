import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Heart, MessageCircle, Bookmark } from "lucide-react"
import { useAuthStore } from "../store/authStore"
import { usePostStore } from "../store/postStore"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SavedPosts = () => {
  const { user, setUser } = useAuthStore()
  const { likePost } = usePostStore()
  const [savedPosts, setSavedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState("")
  const [liking, setLiking] = useState("")

  useEffect(() => {
    const fetchSavedPosts = async () => {
      setLoading(true)
      const res = await fetch(`${API_URL}/users/saved-posts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await res.json()
      setSavedPosts(data.savedPosts || [])
      setLoading(false)
    }
    fetchSavedPosts()
  }, [])

  const handleSavePost = async (postId) => {
    setSaving(postId)
    try {
      const res = await fetch(`${API_URL}/users/save-post/${postId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await res.json()
      if (res.ok) {
        setUser((prev) => ({ ...prev, savedPosts: data.savedPosts }))
        // Remove from UI if unsaved
        if (!data.savedPosts.includes(postId)) {
          setSavedPosts((prev) => prev.filter((p) => p._id !== postId))
        }
      }
    } finally {
      setSaving("")
    }
  }

  const handleLike = async (postId) => {
    setLiking(postId)
    await likePost(postId)
    setLiking("")
    // Optionally, update the local savedPosts state to reflect the new like count
    setSavedPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      )
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Saved Posts</h2>
      {savedPosts.length === 0 ? (
        <div className="text-center py-12 text-base-content/60">No saved posts yet.</div>
      ) : (
        <div className="space-y-6">
          {savedPosts.map((post) => (
            <div key={post._id} className="card bg-base-100 shadow-lg border border-base-300">
              <div className="card-body">
                {/* Post Header */}
                <div className="flex items-center space-x-3 mb-2">
                  <Link to={`/profile/${post.author._id}`} className="avatar">
                    <div className="w-10 h-10 rounded-full">
                      <img src={post.author.avatarUrl || "/placeholder.svg?height=40&width=40"} alt={post.author.name} />
                    </div>
                  </Link>
                  <div>
                    <Link to={`/profile/${post.author._id}`} className="font-semibold hover:link">
                      {post.author.name}
                    </Link>
                    <div className="text-sm text-base-content/60">
                      {post.author.batch} • {post.author.center}
                    </div>
                  </div>
                </div>
                {/* Post Content */}
                <div className="mt-2">
                  <div
                    className="prose max-w-none text-base-content whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      {post.mediaUrls.map((url, index) => (
                        <div key={index} className="relative">
                          {url.includes(".mp4") || url.includes(".mov") || url.includes(".avi") ? (
                            <video src={url} controls className="w-full rounded-lg max-h-[500px] object-contain bg-base-300" />
                          ) : (
                            <img src={url || "/placeholder.svg"} alt={`Post media ${index + 1}`} className="w-full rounded-lg max-h-[500px] object-contain bg-base-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Post Actions */}
                <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-base-300">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center space-x-2 btn btn-ghost btn-sm ${post.isLiked ? "text-error" : ""}`}
                    disabled={liking === post._id}
                  >
                    <Heart size={18} className={post.isLiked ? "fill-current" : ""} />
                    <span>{post.likesCount || 0}</span>
                  </button>
                  <Link to={`/post/${post._id}`} className="flex items-center space-x-2 btn btn-ghost btn-sm">
                    <MessageCircle size={18} />
                    <span>{post.commentsCount || 0}</span>
                  </Link>
                  <button
                    onClick={() => handleSavePost(post._id)}
                    className={`flex items-center space-x-2 btn btn-ghost btn-sm text-primary`}
                    disabled={saving === post._id}
                    title="Unsave"
                  >
                    <Bookmark size={18} className="fill-current" />
                    <span>Unsave</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPosts;