"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Eye, EyeOff, Mail, Phone } from "lucide-react"
import { useAuthStore } from "../store/authStore"

const Login = () => {
  const { login, googleAuth, loading } = useAuthStore()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loginType, setLoginType] = useState("email") // 'email' or 'phone'
  const [loginError, setLoginError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoginError("")
    const result = await login(data.identifier, data.password)
    if (result.notVerified) {
      navigate("/verify-otp", { state: { email: result.email } })
    } else if (!result.success) {
      setLoginError("Invalid credentials")
    }
  }

  const handleGoogleLogin = async () => {
    // This would integrate with Google OAuth
    // For demo purposes, we'll show a placeholder
    console.log("Google login would be implemented here")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="max-w-md w-full">
        <div className="bg-base-100 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Alumni Portal</h1>
            <p className="text-base-content/60 mt-2">Welcome back! Please sign in to your account.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Login Type Toggle */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email Address</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className={`input input-bordered ${errors.identifier ? "input-error" : ""}`}
                {...register("identifier", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.identifier && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.identifier.message}</span>
                </label>
              )}
            </div>

            {/* Password Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`input input-bordered w-full pr-10 ${errors.password ? "input-error" : ""}`}
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && errors.password.type === 'required' && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.password.message}</span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {loginError && (
            <div className="text-error text-sm mt-2">{loginError}</div>
          )}

          {/* Divider */}
          {/* <div className="divider my-6">OR</div> */}

          {/* Google Login
          <button onClick={handleGoogleLogin} className="btn btn-outline w-full">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
           */}

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <span className="text-base-content/60">Don't have an account? </span>
            <Link to="/signup" className="link link-primary">
              Sign up here
            </Link>
            <div className="mt-2">
              <Link to="/forgot-password" className="link link-secondary">
                Forgot Password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
