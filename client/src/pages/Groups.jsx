"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Users, Plus, Search, UserPlus } from "lucide-react"
import useChatStore from "../store/chatStore"
import { useUserStore } from "../store/userStore"

const Groups = () => {
  const { rooms, loading, loadRooms, createRoom } = useChatStore()
  const { searchUsers, searchResults } = useUserStore()
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState([])
  const [notification, setNotification] = useState(null)
  const [groupRooms, setGroupRooms] = useState([])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  useEffect(() => {
    // Filter only group chats
    if (rooms) {
      setGroupRooms(rooms.filter((room) => room.isGroup))
    }
  }, [rooms])

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.trim()) {
      await searchUsers(query)
    }
  }

  const toggleUserSelection = (selectedUser) => {
    if (selectedUsers.some((u) => u._id === selectedUser._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== selectedUser._id))
    } else {
      setSelectedUsers([...selectedUsers, selectedUser])
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 2) {
      setNotification({
        type: "error",
        message: "Please enter a group name and select at least 2 members",
      })
      return
    }

    try {
      const memberIds = selectedUsers.map((u) => u._id)
      const result = await createRoom(groupName, memberIds, true)

      if (result.success) {
        setNotification({
          type: "success",
          message: "Group created successfully!",
        })
        setShowNewGroup(false)
        setGroupName("")
        setSelectedUsers([])
        setSearchQuery("")
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to create group",
      })
    }
  }

  const formatLastMessage = (room) => {
    if (!room.lastMessage) return "No messages yet"

    let content = room.lastMessage.text || "Shared media"
    if (content.length > 30) {
      content = content.substring(0, 30) + "..."
    }

    return `${room.lastMessage.sender?.name || "Unknown"}: ${content}`
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ""

    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"}`}>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Groups</h1>
          <p className="text-base-content/60">Manage your group conversations</p>
        </div>
        <button onClick={() => setShowNewGroup(true)} className="btn btn-primary">
          <Plus size={18} />
          New Group
        </button>
      </div>

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ">
          <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-base-300 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Create New Group</h3>
              <button onClick={() => setShowNewGroup(false)} className="btn btn-ghost btn-sm">
                &times;
              </button>
            </div>

            <div className="p-4">
              {/* Group Name */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Group Name</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="input input-bordered w-full"
                />
              </div>

              {/* Search Users */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Add Members</span>
                </label>
                <div className="input-group">
                  <span>
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search users..."
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedUsers.map((user) => (
                    <div key={user._id} className="badge badge-primary gap-1">
                      {user.name}
                      <button onClick={() => toggleUserSelection(user)}>&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Results */}
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => toggleUserSelection(user)}
                    className={`flex items-center space-x-3 p-3 hover:bg-base-200 cursor-pointer rounded-lg ${
                      selectedUsers.some((u) => u._id === user._id) ? "bg-base-200" : ""
                    }`}
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
                  </div>
                ))}
              </div>

              {/* Create Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedUsers.length < 2}
                  className="btn btn-primary"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : groupRooms.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-base-content/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Groups Yet</h3>
              <p className="text-base-content/60 mb-4">Create a new group to start chatting with multiple alumni</p>
              <button onClick={() => setShowNewGroup(true)} className="btn btn-primary">
                <UserPlus size={18} />
                Create Group
              </button>
            </div>
          ) : (
            <div className="divide-y divide-base-300">
              {groupRooms.map((room) => (
                <Link
                  key={room._id}
                  to={`/chat/${room._id}`}
                  className="flex items-center p-4 hover:bg-base-200 transition-colors"
                >
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center">
                      <Users size={24} />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{room.name}</h3>
                      <span className="text-xs text-base-content/60">
                        {formatTime(room.updatedAt || room.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-base-content/70 line-clamp-1">{formatLastMessage(room)}</p>
                      <span className="text-xs text-base-content/60">{room.members.length} members</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Groups
