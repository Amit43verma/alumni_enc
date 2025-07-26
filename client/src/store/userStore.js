import { create } from "zustand"
import axios from "axios"
import toast from "react-hot-toast"

// Use Vite environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const useUserStore = create((set, get) => ({
  users: [],
  currentProfile: null,
  searchResults: [],
  loading: false,
  filters: {
    batches: [],
    centers: [],
  },

  searchUsers: async (query, filters = {}) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams()
      if (query) params.append("name", query)
      if (filters.batch) params.append("batch", filters.batch)
      if (filters.center) params.append("center", filters.center)

      const response = await axios.get(`${API_URL}/users?${params}`)
      set({ searchResults: response.data.users, loading: false })
      return response.data.users
    } catch (error) {
      set({ loading: false })
      console.error("Failed to search users:", error)
      return []
    }
  },

  loadProfile: async (userId) => {
    set({ loading: true })
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`)
      set({ currentProfile: response.data.user, loading: false })
      return response.data.user
    } catch (error) {
      set({ loading: false })
      toast.error("Failed to load profile")
      return null
    }
  },

  updateProfile: async (userId, formData) => {
    set({ loading: true })
    try {
      const response = await axios.put(`${API_URL}/users/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      set({
        currentProfile: response.data.user,
        loading: false,
      })

      return { success: true, user: response.data.user }
    } catch (error) {
      set({ loading: false })
      const message = error.response?.data?.message || "Failed to update profile"
      toast.error(message)
      return { success: false, message }
    }
  },

  loadUserPosts: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/posts/user/${userId}`)
      return response.data.posts
    } catch (error) {
      console.error("Failed to load user posts:", error)
      return []
    }
  },

  loadFilterOptions: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/meta/options`)
      set({ filters: response.data })
      return response.data
    } catch (error) {
      console.error("Failed to load filter options:", error)
      return { batches: [], centers: [] }
    }
  },

  clearProfile: () => {
    set({ currentProfile: null })
  },
}))

export { useUserStore }
