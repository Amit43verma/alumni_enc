"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Plus, Users, Check, CheckCheck } from "lucide-react"
import useChatStore from "../store/chatStore"
import { useUserStore } from "../store/userStore"
import { useAuthStore } from "../store/authStore"

const ChatList = () => {
  const { user } = useAuthStore()
  const { rooms, loading, loadRooms, createRoom, unreadCounts, isUserOnline } = useChatStore()
  const { searchUsers, searchResults } = useUserStore()
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState("")

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

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

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return

    const memberIds = selectedUsers.map((u) => u._id)
    let name = groupName

    if (!isGroup) {
      name = selectedUsers[0].name
    } else if (!name.trim() && isGroup) {
      name = `Group with ${selectedUsers.map((u) => u.name).join(", ")}`
    }

    const result = await createRoom(name, memberIds, isGroup)
    if (result.success) {
      setShowNewChat(false)
      setSelectedUsers([])
      setIsGroup(false)
      setGroupName("")
    }
  }

  const formatLastMessage = (room) => {
    if (!room.lastMessage) return "No messages yet"

    const sender = room.lastMessage.sender?._id === user?.id ? "You" : room.lastMessage.sender?.name
    let content = room.lastMessage.text || "Shared media"

    if (content.length > 30) {
      content = content.substring(0, 30) + "..."
    }

    return `${sender}: ${content}`
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

  const getOtherUser = (room) => {
    if (room.isGroup) return null
    return room.members.find((member) => member._id !== user?.id)
  }

  // Sort rooms by latest message or updatedAt
  const sortedRooms = [...rooms].sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.updatedAt || 0
    const bTime = b.lastMessage?.createdAt || b.updatedAt || 0
    return new Date(bTime) - new Date(aTime)
  })

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body p-0">
        <div className="flex justify-between items-center p-4 border-b border-base-300">
          <h2 className="text-xl font-bold">Messages</h2>
          <button onClick={() => setShowNewChat(true)} className="btn btn-primary btn-sm">
            <Plus size={18} />
            New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="divide-y divide-base-300">
          {sortedRooms.map((room) => {
            const otherUser = getOtherUser(room)
            const unreadCount = unreadCounts[room._id] || 0

            return (
              <Link
                key={room._id}
                to={`/chat/${room._id}`}
                className="block hover:bg-base-200 transition-colors"
              >
                <div className="flex items-center p-4">
                  <div className="avatar mr-3 relative">
                    <div className="w-12 h-12 rounded-full">
                      {room.isGroup ? (
                        <div className="bg-primary text-primary-content rounded-full flex items-center justify-center w-full h-full">
                          <Users size={20} />
                        </div>
                      ) : (
                        <img
                          src={otherUser?.avatarUrl || "/placeholder.svg?height=48&width=48"}
                          alt={room.name}
                        />
                      )}
                    </div>
                    {/* Online indicator */}
                    {!room.isGroup && otherUser && (
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-base-100 ${
                        isUserOnline(otherUser._id) ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">
                        {room.isGroup ? room.name : otherUser?.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-base-content/60">
                          {formatTime(room.lastMessage?.createdAt || room.updatedAt)}
                        </span>
                        {unreadCount > 0 && (
                          <span className="badge badge-primary badge-sm unread-badge">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-base-content/60 truncate flex-1">
                        {formatLastMessage(room)}
                      </p>
                      {room.lastMessage && room.lastMessage.sender?._id === user?.id && (
                        <div className="ml-2">
                          {room.lastMessage.readBy?.length > 0 ? (
                            <CheckCheck size={14} className="text-blue-500" />
                          ) : (
                            <Check size={14} className="text-base-content/40" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {sortedRooms.length === 0 && !loading && (
          <div className="p-8 text-center text-base-content/60">
            <div className="avatar mb-4">
              <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto">
                <Users size={32} />
              </div>
            </div>
            <p className="text-lg font-medium mb-2">No conversations yet</p>
            <p className="text-sm">Start a new chat to connect with your alumni network!</p>
          </div>
        )}

        {loading && (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* New Chat Modal */}
        {showNewChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
              <div className="p-4 border-b border-base-300 flex justify-between items-center">
                <h3 className="text-lg font-semibold">New Conversation</h3>
                <button onClick={() => setShowNewChat(false)} className="btn btn-ghost btn-sm">
                  &times;
                </button>
              </div>

              <div className="p-4">
                {/* Group Toggle */}
                <div className="form-control mb-4">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input
                      type="checkbox"
                      checked={isGroup}
                      onChange={() => setIsGroup(!isGroup)}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text">Create a group chat</span>
                  </label>
                </div>

                {/* Group Name (if group) */}
                {isGroup && (
                  <div className="form-control mb-4">
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name"
                      className="input input-bordered w-full"
                    />
                  </div>
                )}

                {/* Search Users */}
                <div className="form-control mb-4">
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
                        <div className="w-10 h-10 rounded-full relative">
                          <img src={user.avatarUrl || "/placeholder.svg?height=40&width=40"} alt={user.name} />
                          <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-base-100 ${
                            isUserOnline(user._id) ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
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
                    onClick={handleCreateChat}
                    disabled={selectedUsers.length === 0}
                    className="btn btn-primary"
                  >
                    Create Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatList
