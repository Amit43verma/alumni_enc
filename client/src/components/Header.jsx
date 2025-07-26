"use client"

import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Search, Menu, Bell, MessageCircle, User, LogOut, Settings, Sun, Moon } from "lucide-react"
import { useAuthStore } from "../store/authStore"
import { useUserStore } from "../store/userStore"
import { debounce } from "lodash"

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore()
  const { searchUsers, searchResults } = useUserStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light")

  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      if (query.trim()) {
        searchUsers(query)
        setShowSearchResults(true)
      } else {
        setShowSearchResults(false)
      }
    }, 300),
    [],
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleUserSelect = (userId) => {
    navigate(`/profile/${userId}`)
    setSearchQuery("")
    setShowSearchResults(false)
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="bg-base-200 border-b border-base-300 h-14 flex items-center justify-center px-4 relative z-40">
      <div className="flex items-center justify-between w-full">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button onClick={onMenuClick} className="lg:hidden btn btn-ghost btn-sm">
            <Menu size={20} />
          </button>

          <Link to="/feed" className="text-xl font-bold text-primary">
            Alumni Portal
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-md mx-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" size={20} />
            <input
              type="text"
              placeholder="Search alumni..."
              className="input rounded-full input-bordered h-10 w-full pl-10 border-base-300 focus:border-primary"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            />
          </div>

          {/* Search results dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center space-x-3 p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                  onClick={() => handleUserSelect(user._id)}
                >
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full">
                      <img src={user.avatarUrl || "/placeholder.svg?height=32&width=32"} alt={user.name} />
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
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* Theme toggle */}
          <button onClick={toggleTheme} className="btn btn-ghost btn-sm" title="Toggle theme">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notifications */}
          <button className="btn btn-ghost btn-sm">
            <Bell size={20} />
          </button>

          {/* Messages */}
          <Link to="/chat" className="btn btn-ghost btn-sm">
            <MessageCircle size={20} />
          </Link>

          {/* User menu */}
          <div className="dropdown dropdown-end relative z-50">
            <label tabIndex={0} className="btn btn-ghost btn-sm">
              <div className="avatar">
                <div className="w-8 h-8 rounded-full">
                  <img src={user?.avatarUrl || "/placeholder.svg?height=32&width=32"} alt={user?.name} />
                </div>
              </div>
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-xl bg-base-100 border border-base-300 rounded-box w-52 mt-2 z-50"
            >
              <li>
                <Link to={`/profile/${user?.id}`} className="flex items-center space-x-2">
                  <User size={16} />
                  <span>Profile</span>
                </Link>
              </li>
              <li>
                <Link to="/edit-profile" className="flex items-center space-x-2">
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="flex items-center space-x-2 text-error">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
