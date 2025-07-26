import { create } from "zustand"
import axios from "axios"
import toast from "react-hot-toast"
import io from "socket.io-client"
import { useAuthStore } from "./authStore"

// Use Vite environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"

const usePostStore = create((set, get) => ({
  socket: null,
  posts: [],
  currentPost: null,
  comments: [],
  postLikes: [],
  commentLikes: [],
  loading: false,
  hasMore: true,
  page: 1,

  initializeSocket: () => {
    const token = localStorage.getItem("token")
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth: { token },
    })

    socket.on("connect", () => {
      console.log("Connected to post server")
    })

    socket.on("postLikeUpdate", (data) => {
      const { postId, likesCount, likedUserIds } = data
      const userId = JSON.parse(localStorage.getItem("user"))?.id
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? { ...post, isLiked: likedUserIds?.includes(userId), likesCount } : post
        ),
        currentPost:
          state.currentPost?._id === postId
            ? { ...state.currentPost, isLiked: likedUserIds?.includes(userId), likesCount }
            : state.currentPost,
      }))
    })

    socket.on("commentLikeUpdate", (data) => {
      const { commentId, likesCount, likedUserIds } = data
      const userId = JSON.parse(localStorage.getItem("user"))?.id
      set((state) => ({
        comments: state.comments.map((c) => {
          if (c._id === commentId) {
            return { ...c, isLiked: likedUserIds?.includes(userId), likesCount }
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r._id === commentId ? { ...r, isLiked: likedUserIds?.includes(userId), likesCount } : r
              ),
            }
          }
          return c
        }),
      }))
    })

    socket.on("error", (error) => {
      toast.error(error.message || "Post error occurred")
    })

    socket.on("newPost", (post) => {
      set((state) => {
        if (state.posts.some((p) => p._id === post._id)) {
          return {} // Already exists, do nothing
        }
        return { posts: [post, ...state.posts] }
      })
    })

    socket.on("newComment", ({ comment, parentComment }) => {
      set((state) => {
        if (!parentComment) {
          // New top-level comment
          if (state.comments.some((c) => c._id === comment._id)) {
            return {} // Already exists
          }
          return { comments: [...state.comments, { ...comment, isLiked: false, replies: [] }] }
        } else {
          // New reply to a comment
          return {
            comments: state.comments.map((c) => {
              if (c._id === parentComment) {
                if ((c.replies || []).some((r) => r._id === comment._id)) {
                  return c // Already exists
                }
                return {
                  ...c,
                  replies: [...(c.replies || []), { ...comment, isLiked: false }],
                  repliesCount: (c.repliesCount || 0) + 1,
                }
              }
              return c
            }),
          }
        }
      })
    })

    socket.on("commentEdited", ({ comment }) => {
      set((state) => ({
        comments: state.comments.map((c) => {
          if (c._id === comment._id) {
            return { ...c, ...comment }
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) => (r._id === comment._id ? { ...r, ...comment } : r)),
            }
          }
          return c
        }),
      }))
    })

    // Real-time comment deletion
    socket.on("commentDeleted", ({ commentId, parentComment }) => {
      set((state) => {
        if (parentComment) {
          // Remove reply from parent comment
          return {
            comments: state.comments.map((c) =>
              c._id === parentComment
                ? {
                    ...c,
                    replies: c.replies.filter((r) => r._id !== commentId),
                    repliesCount: Math.max(0, (c.repliesCount || 0) - 1),
                  }
                : c
            ),
          }
        } else {
          // Remove top-level comment
          return {
            comments: state.comments.filter((comment) => comment._id !== commentId),
          }
        }
      })
    })

    set({ socket })
  },

  disconnectSocket: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null })
    }
  },

  joinPost: (postId) => {
    const { socket } = get()
    if (socket) {
      socket.emit("joinPost", postId)
    }
  },

  leavePost: (postId) => {
    const { socket } = get()
    if (socket) {
      socket.emit("leavePost", postId)
    }
  },

  loadFeed: async (page = 1, reset = false) => {
    set({ loading: true })
    try {
      const response = await axios.get(`${API_URL}/posts?page=${page}&limit=10`)
      const { posts, totalPages, currentPage } = response.data

      set((state) => ({
        posts: reset ? posts : [...state.posts, ...posts],
        hasMore: currentPage < totalPages,
        page: currentPage,
        loading: false,
      }))
    } catch (error) {
      set({ loading: false })
      toast.error("Failed to load posts")
    }
  },

  createPost: async (content, mediaFiles) => {
    try {
      const formData = new FormData()
      formData.append("content", content)

      if (mediaFiles) {
        Array.from(mediaFiles).forEach((file) => {
          formData.append("media", file)
        })
      }

      const response = await axios.post(`${API_URL}/posts`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      toast.success("Post created successfully!")
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to create post"
      toast.error(message)
      return { success: false, message }
    }
  },

  deletePost: async (postId) => {
    try {
      await axios.delete(`${API_URL}/posts/${postId}`)

      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId),
      }))

      toast.success("Post deleted successfully")
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete post"
      toast.error(message)
      return { success: false }
    }
  },

  likePost: async (postId) => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/like`)
      const { liked, likesCount } = response.data

      const { socket } = get()
      if (socket) {
        socket.emit("postLiked", { postId, liked, likesCount })
      }

      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? { ...post, isLiked: liked, likesCount } : post
        ),
        currentPost:
          state.currentPost?._id === postId
            ? { ...state.currentPost, isLiked: liked, likesCount }
            : state.currentPost,
      }))

      return { success: true }
    } catch (error) {
      toast.error("Failed to like post")
      return { success: false }
    }
  },

  loadPost: async (postId) => {
    set({ loading: true })
    try {
      const response = await axios.get(`${API_URL}/posts/${postId}`)
      const { post, comments } = response.data

      set({
        currentPost: post,
        comments,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      toast.error("Failed to load post")
    }
  },

  loadPostLikes: async (postId) => {
    try {
      const response = await axios.get(`${API_URL}/posts/${postId}/likes`)
      set({ postLikes: response.data.likes })
      return response.data.likes
    } catch (error) {
      toast.error("Failed to load likes")
      return []
    }
  },

  loadCommentLikes: async (commentId) => {
    try {
      const response = await axios.get(`${API_URL}/posts/comments/${commentId}/likes`)
      set({ commentLikes: response.data.likes })
      return response.data.likes
    } catch (error) {
      toast.error("Failed to load comment likes")
      return []
    }
  },

  addComment: async (postId, text, parentComment = null) => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/comments`, { text, parentComment })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to add comment"
      toast.error(message)
      return { success: false }
    }
  },

  editComment: async (commentId, text) => {
    try {
      const response = await axios.put(`${API_URL}/posts/comments/${commentId}`, { text })
      const { comment } = response.data

      set((state) => ({
        comments: state.comments.map((c) => {
          if (c._id === commentId) {
            return { ...c, ...comment }
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) => (r._id === commentId ? { ...r, ...comment } : r)),
            }
          }
          return c
        }),
      }))

      toast.success("Comment updated")
      return { success: true }
    } catch (error) {
      toast.error("Failed to update comment")
      return { success: false }
    }
  },

  likeComment: async (commentId) => {
    try {
      const response = await axios.post(`${API_URL}/posts/comments/${commentId}/like`)
      const { liked, likesCount, likedUserIds } = response.data

      const { socket, currentPost } = get()
      if (socket && currentPost) {
        socket.emit("commentLiked", { postId: currentPost._id, commentId, liked, likesCount, likedUserIds })
      }

      const userId = JSON.parse(localStorage.getItem("user"))?.id
      set((state) => ({
        comments: state.comments.map((c) => {
          if (c._id === commentId) {
            return { ...c, isLiked: likedUserIds?.includes(userId), likesCount }
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r._id === commentId ? { ...r, isLiked: likedUserIds?.includes(userId), likesCount } : r
              ),
            }
          }
          return c
        }),
      }))

      return { success: true }
    } catch (error) {
      toast.error("Failed to like comment")
      return { success: false }
    }
  },

  deleteComment: async (commentId, postId, parentComment = null) => {
    try {
      await axios.delete(`${API_URL}/posts/comments/${commentId}`)

      if (parentComment) {
        // Remove reply from parent comment
        set((state) => ({
          comments: state.comments.map((c) =>
            c._id === parentComment
              ? {
                  ...c,
                  replies: c.replies.filter((r) => r._id !== commentId),
                  repliesCount: Math.max(0, (c.repliesCount || 0) - 1),
                }
              : c,
          ),
        }))
      } else {
        // Remove top-level comment
        set((state) => ({
          comments: state.comments.filter((comment) => comment._id !== commentId),
          posts: state.posts.map((post) =>
            post._id === postId ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) } : post,
          ),
          currentPost:
            state.currentPost?._id === postId
              ? { ...state.currentPost, commentsCount: Math.max(0, state.currentPost.commentsCount - 1) }
              : state.currentPost,
        }))
      }

      toast.success("Comment deleted")
      return { success: true }
    } catch (error) {
      toast.error("Failed to delete comment")
      return { success: false }
    }
  },

  reset: () => {
    set({
      posts: [],
      currentPost: null,
      comments: [],
      postLikes: [],
      commentLikes: [],
      loading: false,
      hasMore: true,
      page: 1,
    })
  },
}))

export { usePostStore }
