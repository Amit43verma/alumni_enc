"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, Mail, Phone, MapPin, Calendar, Plus, Trash2, Github, Linkedin, Twitter, Save, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { useUserStore } from "../store/userStore"
import { useAuthStore } from "../store/authStore"

const EditProfile = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const { currentProfile, loading, loadProfile, updateProfile } = useUserStore()
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [experiences, setExperiences] = useState([])
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState("")
  const [showExperienceForm, setShowExperienceForm] = useState(false)
  const [currentExperience, setCurrentExperience] = useState({
    title: "",
    company: "",
    from: "",
    to: "",
    current: false,
    description: "",
  })
  const [notification, setNotification] = useState(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id)
    }
  }, [user?.id, loadProfile])

  // Redirect if not the owner
  useEffect(() => {
    if (currentProfile && user && currentProfile._id !== user.id) {
      setNotification({
        type: "error",
        message: "You are not authorized to edit this profile.",
      })
      setTimeout(() => {
        navigate("/feed")
      }, 2000)
    }
  }, [currentProfile, user, navigate])

  useEffect(() => {
    if (currentProfile) {
      setValue("name", currentProfile.name)
      setValue("email", currentProfile.email)
      setValue("phone", currentProfile.phone)
      setValue("batch", currentProfile.batch)
      setValue("center", currentProfile.center)
      setValue("bio", currentProfile.bio || "")
      setValue("linkedin", currentProfile.socialLinks?.linkedin || "")
      setValue("github", currentProfile.socialLinks?.github || "")
      setValue("twitter", currentProfile.socialLinks?.twitter || "")

      setExperiences(currentProfile.experiences || [])
      setSkills(currentProfile.skills || [])
    }
  }, [currentProfile, setValue])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const handleExperienceChange = (e) => {
    const { name, value, type, checked } = e.target
    setCurrentExperience({
      ...currentExperience,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleAddExperience = () => {
    if (currentExperience.title && currentExperience.company && currentExperience.from) {
      setExperiences([...experiences, { ...currentExperience, id: Date.now() }])
      setCurrentExperience({
        title: "",
        company: "",
        from: "",
        to: "",
        current: false,
        description: "",
      })
      setShowExperienceForm(false)
    }
  }

  const handleRemoveExperience = (id) => {
    setExperiences(experiences.filter((exp) => exp.id !== id))
  }

  const onSubmit = async (data) => {
    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("email", data.email)
    formData.append("phone", data.phone || "")
    formData.append("batch", data.batch)
    formData.append("center", data.center)
    formData.append("bio", data.bio)

    // Social links
    const socialLinks = {
      linkedin: data.linkedin || "",
      github: data.github || "",
      twitter: data.twitter || "",
    }
    formData.append("socialLinks", JSON.stringify(socialLinks))

    // Skills
    formData.append("skills", JSON.stringify(skills))

    // Experiences
    formData.append("experiences", JSON.stringify(experiences))

    // Avatar
    if (avatarFile) {
      formData.append("avatar", avatarFile)
    }

    try {
      const result = await updateProfile(user.id, formData)
      if (result.success) {
        // Update user in auth store
        updateUser({
          name: data.name,
          email: data.email,
          phone: data.phone,
          batch: data.batch,
          center: data.center,
          avatarUrl: result.user.avatarUrl,
        })

        // Show success notification
        setNotification({
          type: "success",
          message: "Profile updated successfully!",
        })

        // Navigate after a short delay
        setTimeout(() => {
          navigate(`/profile/${user.id}`)
        }, 2000)
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: error.message || "Failed to update profile",
      })
    }
  }

  if (loading && !currentProfile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
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

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center space-y-4">
              <div className="avatar">
                <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img
                    src={avatarPreview || currentProfile?.avatarUrl || "/placeholder.svg?height=96&width=96"}
                    alt="Profile"
                  />
                </div>
              </div>
              <label className="btn btn-outline btn-sm">
                Change Photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            {/* Basic Info */}
            <div className="divider">Basic Information</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Full Name</span>
                </label>
                <div className="input-group">
                  <span>
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    className={`input input-bordered w-full ${errors.name ? "input-error" : ""}`}
                    {...register("name", { required: "Name is required" })}
                  />
                </div>
                {errors.name && <span className="text-error text-sm mt-1">{errors.name.message}</span>}
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <div className="input-group">
                  <span>
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    className={`input input-bordered w-full ${errors.email ? "input-error" : ""}`}
                    {...register("email", {
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                </div>
                {errors.email && <span className="text-error text-sm mt-1">{errors.email.message}</span>}
              </div>

              {/* Phone (optional) */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone</span>
                </label>
                <div className="input-group">
                  <span>
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    className={`input input-bordered w-full ${errors.phone ? "input-error" : ""}`}
                    {...register("phone", {
                      pattern: {
                        value: /^[+]?[0-9]{10,15}$/,
                        message: "Invalid phone number",
                      },
                    })}
                  />
                </div>
                {errors.phone && <span className="text-error text-sm mt-1">{errors.phone.message}</span>}
              </div>

              {/* Batch */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Batch</span>
                </label>
                <div className="input-group">
                  <span>
                    <Calendar size={18} />
                  </span>
                  <input
                    type="text"
                    className={`input input-bordered w-full ${errors.batch ? "input-error" : ""}`}
                    {...register("batch", { required: "Batch is required" })}
                  />
                </div>
                {errors.batch && <span className="text-error text-sm mt-1">{errors.batch.message}</span>}
              </div>

              {/* Center */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Center</span>
                </label>
                <div className="input-group">
                  <span>
                    <MapPin size={18} />
                  </span>
                  <input
                    type="text"
                    className={`input input-bordered w-full ${errors.center ? "input-error" : ""}`}
                    {...register("center", { required: "Center is required" })}
                  />
                </div>
                {errors.center && <span className="text-error text-sm mt-1">{errors.center.message}</span>}
              </div>
            </div>

            {/* Bio */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Bio</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Tell us about yourself..."
                {...register("bio")}
              ></textarea>
            </div>

            {/* Social Links */}
            <div className="divider">Social Links</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LinkedIn */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">LinkedIn</span>
                </label>
                <div className="input-group">
                  <span>
                    <Linkedin size={18} />
                  </span>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    className="input input-bordered w-full"
                    {...register("linkedin")}
                  />
                </div>
              </div>

              {/* GitHub */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">GitHub</span>
                </label>
                <div className="input-group">
                  <span>
                    <Github size={18} />
                  </span>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    className="input input-bordered w-full"
                    {...register("github")}
                  />
                </div>
              </div>

              {/* Twitter */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Twitter</span>
                </label>
                <div className="input-group">
                  <span>
                    <Twitter size={18} />
                  </span>
                  <input
                    type="url"
                    placeholder="https://twitter.com/username"
                    className="input input-bordered w-full"
                    {...register("twitter")}
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="divider">Skills</div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Skills</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill, index) => (
                  <div key={index} className="badge badge-primary gap-1">
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  className="input input-bordered flex-1"
                />
                <button type="button" onClick={handleAddSkill} className="btn btn-primary">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Experience */}
            <div className="divider">Experience</div>

            <div className="space-y-4">
              {/* Experience List */}
              {experiences.map((exp, index) => (
                <div key={index} className="border border-base-300 rounded-lg p-4 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(exp.id)}
                    className="absolute top-2 right-2 btn btn-ghost btn-sm text-error"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex flex-col md:flex-row md:justify-between">
                    <div>
                      <h3 className="font-semibold">{exp.title}</h3>
                      <p>{exp.company}</p>
                    </div>
                    <div className="text-sm text-base-content/60">
                      {new Date(exp.from).toLocaleDateString()} -{" "}
                      {exp.current ? "Present" : new Date(exp.to).toLocaleDateString()}
                    </div>
                  </div>
                  {exp.description && <p className="mt-2 text-sm">{exp.description}</p>}
                </div>
              ))}

              {/* Add Experience Button */}
              {!showExperienceForm && (
                <button type="button" onClick={() => setShowExperienceForm(true)} className="btn btn-outline w-full">
                  <Plus size={18} />
                  Add Experience
                </button>
              )}

              {/* Experience Form */}
              {showExperienceForm && (
                <div className="border border-base-300 rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Add Experience</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Title</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={currentExperience.title}
                        onChange={handleExperienceChange}
                        placeholder="Job Title"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Company</span>
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={currentExperience.company}
                        onChange={handleExperienceChange}
                        placeholder="Company Name"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">From</span>
                      </label>
                      <input
                        type="date"
                        name="from"
                        value={currentExperience.from}
                        onChange={handleExperienceChange}
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">To</span>
                      </label>
                      <input
                        type="date"
                        name="to"
                        value={currentExperience.to}
                        onChange={handleExperienceChange}
                        className="input input-bordered w-full"
                        disabled={currentExperience.current}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          name="current"
                          checked={currentExperience.current}
                          onChange={handleExperienceChange}
                          className="checkbox checkbox-primary"
                        />
                        <span className="label-text">I currently work here</span>
                      </label>
                    </div>
                  </div>
                  <div className="form-control mt-4">
                    <label className="label">
                      <span className="label-text">Description</span>
                    </label>
                    <textarea
                      name="description"
                      value={currentExperience.description}
                      onChange={handleExperienceChange}
                      placeholder="Job description..."
                      className="textarea textarea-bordered h-24"
                    ></textarea>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button type="button" onClick={() => setShowExperienceForm(false)} className="btn btn-ghost">
                      Cancel
                    </button>
                    <button type="button" onClick={handleAddExperience} className="btn btn-primary">
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
              <button type="submit" className="btn btn-primary">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditProfile
