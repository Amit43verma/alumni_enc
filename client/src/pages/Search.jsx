"use client"

import { useEffect, useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { SearchIcon, Filter, MapPin, Calendar, User, MessageCircle, Users } from "lucide-react"
import { useUserStore } from "../store/userStore"
import useChatStore from "../store/chatStore"
import { debounce } from "lodash"

const Search = () => {
  const navigate = useNavigate()
  const { searchUsers, searchResults, loading, filters, loadFilterOptions } = useUserStore()
  const { createRoom } = useChatStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")
  const [selectedCenter, setSelectedCenter] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [notification, setNotification] = useState(null)

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((query, filters) => {
      searchUsers(query, filters)
    }, 300),
    [],
  )

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  useEffect(() => {
    const searchFilters = {}
    if (selectedBatch) searchFilters.batch = selectedBatch
    if (selectedCenter) searchFilters.center = selectedCenter

    debouncedSearch(searchQuery, searchFilters)
  }, [searchQuery, selectedBatch, selectedCenter, debouncedSearch])

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const clearFilters = () => {
    setSelectedBatch("")
    setSelectedCenter("")
    setSearchQuery("")
  }

  const handleStartChat = async (userId) => {
    try {
      const result = await createRoom("", [userId], false)
      if (result.success) {
        setNotification({
          type: "success",
          message: "Chat created successfully! Redirecting...",
        })
        setTimeout(() => {
          navigate(`/chat/${result.room._id}`)
        }, 1000)
      } else {
        setNotification({
          type: "error",
          message: "Failed to create chat",
        })
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to create chat",
      })
    }
  }

  const activeFiltersCount = [selectedBatch, selectedCenter].filter(Boolean).length

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"} shadow-lg`}>
          <div>
            {notification.type === "success" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Search Alumni</h1>
        <p className="text-base-content/60">Find and connect with fellow alumni</p>
      </div>

      {/* Search Bar */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="input-group">
                <span>
                  <SearchIcon size={20} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleInputChange}
                  placeholder="Search by name..."
                  className="input input-bordered w-full border-base-300 focus:border-primary"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-outline ${activeFiltersCount > 0 ? "btn-primary" : ""}`}
            >
              <Filter size={18} />
              Filters
              {activeFiltersCount > 0 && <span className="badge badge-primary badge-sm">{activeFiltersCount}</span>}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg border border-base-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Batch Filter */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Batch</span>
                  </label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="select select-bordered w-full border-base-300"
                  >
                    <option value="">All Batches</option>
                    {filters.batches?.map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Center Filter */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Center</span>
                  </label>
                  <select
                    value={selectedCenter}
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    className="select select-bordered w-full border-base-300"
                  >
                    <option value="">All Centers</option>
                    {filters.centers?.map((center) => (
                      <option key={center} value={center}>
                        {center}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end mt-4 space-x-2">
                <button onClick={clearFilters} className="btn btn-ghost btn-sm">
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Search Results
              {searchResults.length > 0 && (
                <span className="text-base-content/60 font-normal ml-2">({searchResults.length} found)</span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-base-content/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-base-content/60">
                {searchQuery || selectedBatch || selectedCenter
                  ? "Try adjusting your search criteria"
                  : "Start searching to find alumni"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="card bg-base-200 hover:bg-base-300 transition-colors border border-base-300"
                >
                  <div className="card-body">
                    {/* User Avatar and Basic Info */}
                    <div className="flex items-center space-x-3 mb-4">
                      <Link to={`/profile/${user._id}`} className="avatar">
                        <div className="w-16 h-16 rounded-full">
                          <img src={user.avatarUrl || "/placeholder.svg?height=64&width=64"} alt={user.name} />
                        </div>
                      </Link>
                      <div className="flex-1">
                        <Link to={`/profile/${user._id}`} className="font-semibold hover:link">
                          {user.name}
                        </Link>
                        <div className="text-sm text-base-content/70 mt-1">
                          {user.bio && user.bio.length > 50 ? `${user.bio.substring(0, 50)}...` : user.bio || "Alumni"}
                        </div>
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-base-content/70">
                        <Calendar size={16} className="mr-2" />
                        <span>Batch: {user.batch}</span>
                      </div>
                      <div className="flex items-center text-sm text-base-content/70">
                        <MapPin size={16} className="mr-2" />
                        <span>{user.center}</span>
                      </div>
                    </div>

                    {/* Skills Preview */}
                    {user.skills && user.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {user.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="badge badge-primary badge-sm">
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 3 && (
                            <span className="badge badge-ghost badge-sm">+{user.skills.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="card-actions justify-end">
                      <button onClick={() => handleStartChat(user._id)} className="btn btn-primary btn-sm">
                        <MessageCircle size={16} />
                        Message
                      </button>
                      <Link to={`/profile/${user._id}`} className="btn btn-outline btn-sm">
                        <User size={16} />
                        Profile
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Tips */}
      {searchResults.length === 0 && !loading && (
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">Search Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Search by Name</h4>
                <p className="text-sm text-base-content/70">Enter full or partial names to find specific alumni</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Use Filters</h4>
                <p className="text-sm text-base-content/70">Filter by batch year or center to narrow down results</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Browse All</h4>
                <p className="text-sm text-base-content/70">Leave search empty and use filters to browse all alumni</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Connect</h4>
                <p className="text-sm text-base-content/70">Send messages or view profiles to connect with alumni</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Search
