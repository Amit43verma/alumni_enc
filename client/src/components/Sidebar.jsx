"use client"

import { Link, useLocation } from "react-router-dom"
import { Home, MessageCircle, Users, Search, User, X, Bookmark } from "lucide-react"
import useChatStore from "../store/chatStore"

const Sidebar = ({ onClose }) => {
  const location = useLocation()
  const userId = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : null
  const { unreadCounts } = useChatStore()

  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)

  const menuItems = [
    { path: "/feed", icon: Home, label: "Feed" },
    {
      path: "/chat",
      icon: MessageCircle,
      label: "Messages",
      notificationCount: totalUnreadCount,
    },
    { path: "/groups", icon: Users, label: "Groups" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/saved-posts", icon: Bookmark, label: "Saved Posts" },
    { path: userId ? `/profile/${userId}` : "/login", icon: User, label: "Profile" },
  ]

  return (
    <div className="h-full flex flex-col bg-base-200">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-base-300">
        <h2 className="text-lg font-semibold m-0">Menu</h2>
        <button onClick={onClose} className="lg:hidden btn btn-ghost btn-sm">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map(({ path, icon: Icon, label, notificationCount }) => (
            <li key={path}>
              <Link
                to={path}
                onClick={onClose}
                className={`
                  flex items-center justify-between space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${location.pathname.startsWith(path) && path !== "/" ? "bg-primary text-primary-content" : "hover:bg-base-300"}
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={20} />
                  <span>{label}</span>
                </div>
                {notificationCount > 0 && (
                  <span className="badge badge-error text-white">{notificationCount > 99 ? "99+" : notificationCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-base-300">
        <div className="text-sm text-base-content/60 text-center">Alumni Portal v1.0</div>
      </div>
    </div>
  )
}

export default Sidebar
