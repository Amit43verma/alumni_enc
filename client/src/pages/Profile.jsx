"use client"

import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Mail, Phone, MapPin, Calendar, Edit, Github, Linkedin, Twitter, MessageCircle, Heart } from "lucide-react"
import { useUserStore } from "../store/userStore"
import { useAuthStore } from "../store/authStore"
import useChatStore from "../store/chatStore"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Profile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentProfile, loading, loadProfile } = useUserStore()
  const { user } = useAuthStore()
  const { createRoom } = useChatStore()
  const [activeTab, setActiveTab] = useState("posts")
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [userPosts, setUserPosts] = useState([])
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const profile = await loadProfile(id)
        setIsOwnProfile(id === user?.id)

        if (profile) {
          // Fetch user posts from posts API
          try {
            const response = await fetch(`${API_URL}/posts/user/${id}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            })
            const data = await response.json()
            setUserPosts(data.posts || [])
          } catch (error) {
            console.error("Failed to load user posts:", error)
            setUserPosts([])
          }
        }
      }
    }

    fetchData()
  }, [id, user?.id, loadProfile])

  const handleStartChat = async () => {
    if (!currentProfile) return

    try {
      const result = await createRoom("", [currentProfile._id], false)
      if (result.success) {
        navigate(`/chat/${result.room._id}`)
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Failed to create chat",
      })
    }
  }

  if (loading || !currentProfile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

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

      {/* Profile Header */}
      <div className="card bg-base-100 shadow-lg border border-base-300 overflow-hidden">
        {/* Cover Photo */}
        <div className="h-40 bg-gradient-to-r from-primary/30 to-secondary/30"></div>

        <div className="card-body relative">
          {/* Avatar */}
          <div className="avatar absolute -top-16 left-8 ring ring-base-100 ring-offset-base-100 ring-offset-2">
            <div className="w-28 h-28 rounded-full">
              <img
                src={currentProfile.avatarUrl || "/placeholder.svg?height=112&width=112"}
                alt={currentProfile.name}
              />
            </div>
          </div>

          {/* Profile Actions */}
          <div className="flex justify-end mb-10 sm:mb-0">
            {isOwnProfile ? (
              <Link to="/edit-profile" className="btn btn-primary">
                <Edit size={18} />
                Edit Profile
              </Link>
            ) : (
              <button onClick={handleStartChat} className="btn btn-primary">
                <MessageCircle size={18} />
                Message
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="mt-8">
            <h1 className="text-2xl font-bold">{currentProfile.name}</h1>
            <p className="text-base-content/70 mt-1">{currentProfile.bio || `Alumni from ${currentProfile.center}`}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                {currentProfile.email && (
                  <div className="flex items-center space-x-2">
                    <Mail size={18} className="text-base-content/70" />
                    <span>{currentProfile.email}</span>
                  </div>
                )}
                {currentProfile.phone && currentProfile.phone.trim() !== "" && (
                  <div className="flex items-center space-x-2">
                    <Phone size={18} className="text-base-content/70" />
                    <span>{currentProfile.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <MapPin size={18} className="text-base-content/70" />
                  <span>{currentProfile.center}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={18} className="text-base-content/70" />
                  <span>Batch: {currentProfile.batch}</span>
                </div>
              </div>

              {/* Social Links */}
              {currentProfile.socialLinks && (
                <div className="space-y-2">
                  {currentProfile.socialLinks.linkedin && (
                    <a
                      href={currentProfile.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 hover:text-primary"
                    >
                      <Linkedin size={18} />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {currentProfile.socialLinks.github && (
                    <a
                      href={currentProfile.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 hover:text-primary"
                    >
                      <Github size={18} />
                      <span>GitHub</span>
                    </a>
                  )}
                  {currentProfile.socialLinks.twitter && (
                    <a
                      href={currentProfile.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 hover:text-primary"
                    >
                      <Twitter size={18} />
                      <span>Twitter</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 border border-base-300">
        <button className={`tab ${activeTab === "posts" ? "tab-active" : ""}`} onClick={() => setActiveTab("posts")}>
          Posts
        </button>
        <button className={`tab ${activeTab === "about" ? "tab-active" : ""}`} onClick={() => setActiveTab("about")}>
          About
        </button>
        <button
          className={`tab ${activeTab === "experience" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("experience")}
        >
          Experience
        </button>
      </div>

      {/* Tab Content */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body">
          {/* Posts Tab */}
          {activeTab === "posts" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Posts</h2>
              {userPosts.length === 0 ? (
                <div className="text-center py-8 text-base-content/60">
                  {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
                </div>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <div
                      key={post._id}
                      className="border border-base-300 rounded-lg p-4 hover:bg-base-200/50 transition-colors"
                    >
                      <Link to={`/post/${post._id}`} className="block">
                        <div className="line-clamp-3 mb-3" dangerouslySetInnerHTML={{ __html: post.content }} />

                        {/* Show media preview in profile */}
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                            {post.mediaUrls.slice(0, 3).map((url, index) => (
                              <div key={index} className="relative">
                                {url.includes(".mp4") || url.includes(".mov") || url.includes(".avi") ? (
                                  <video src={url} className="w-full h-24 object-cover rounded-lg" muted />
                                ) : (
                                  <img
                                    src={url || "/placeholder.svg?height=96&width=96"}
                                    alt={`Post media ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                )}
                                {post.mediaUrls.length > 3 && index === 2 && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                    <span className="text-white font-semibold">+{post.mediaUrls.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-base-content/60">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Heart size={14} /> <span>{post.likesCount || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MessageCircle size={14} /> <span>{post.commentsCount || 0}</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <div className="space-y-6">
                {/* Bio */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Bio</h3>
                  <p className="text-base-content/80">
                    {currentProfile.bio || "No bio information has been added yet."}
                  </p>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Skills</h3>
                  {currentProfile.skills && currentProfile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.skills.map((skill, index) => (
                        <span key={index} className="badge badge-primary badge-outline">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base-content/60">No skills have been added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === "experience" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Experience</h2>
              {currentProfile.experiences && currentProfile.experiences.length > 0 ? (
                <div className="space-y-6">
                  {currentProfile.experiences.map((exp, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4 py-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{exp.title}</h3>
                          <p className="text-base-content/80">{exp.company}</p>
                        </div>
                        <div className="text-sm text-base-content/60">
                          {new Date(exp.from).toLocaleDateString()} -{" "}
                          {exp.current ? "Present" : new Date(exp.to).toLocaleDateString()}
                        </div>
                      </div>
                      {exp.description && <p className="mt-2 text-base-content/80">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-base-content/60">No experience has been added yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
