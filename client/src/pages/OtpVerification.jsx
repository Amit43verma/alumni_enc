import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { useAuthStore } from "../store/authStore"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const OtpVerification = () => {
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const { loginSuccess } = useAuthStore()

  const email = location.state?.email

  if (!email) {
    // Redirect to signup if email is not available
    navigate("/signup")
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp })
      loginSuccess(response.data)
      navigate("/") // Redirect to feed on successful verification
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setResendMessage("")
    setError("")
    setResendLoading(true)
    try {
      await axios.post(`${API_URL}/auth/resend-otp`, { email })
      setResendMessage("A new OTP has been sent to your email.")
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Verify Your Email
        </h2>
        <p className="text-center text-gray-600">
          An OTP has been sent to <strong>{email}</strong>. Please enter it
          below to verify your account.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="otp"
              className="text-sm font-medium text-gray-700"
            >
              OTP
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your 6-digit OTP"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {resendMessage && (
            <p className="text-sm text-green-600">{resendMessage}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
        <div className="text-center">
          <button
            onClick={handleResendOtp}
            disabled={resendLoading}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OtpVerification 