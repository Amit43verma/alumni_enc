"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Eye, EyeOff, Mail, Phone, Calendar } from "lucide-react"
import { useAuthStore } from "../store/authStore"

const Signup = () => {
  const { signup, loading } = useAuthStore()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [contactType, setContactType] = useState("email") // Remove phone toggle
  const currentYear = new Date().getFullYear();
  const [batchStart, setBatchStart] = useState(2023);
  const [showChecklist, setShowChecklist] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm()
  const password = watch("password") || "";
  const confirmPassword = watch("confirmPassword") || "";

  const onSubmit = async (data) => {
    const userData = {
      name: data.name,
      password: data.password,
      batch: data.batch,
      center: data.center,
      email: data.contact, // always email
    }
    const result = await signup(userData)
    if (result.success) {
      navigate("/verify-otp", { state: { email: userData.email } })
    } else {
      console.error("Signup failed:", result.message)
    }
  }

  const passwordRules = [
    { label: "At least 8 characters", test: (v) => v.length >= 8 },
    { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
    { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
    { label: "One digit", test: (v) => /[0-9]/.test(v) },
    { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
  ];
  const isStrong = passwordRules.every(rule => rule.test(password));
  const passwordsMatch = password === confirmPassword && password.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-base-100 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Join Alumni Portal</h1>
            <p className="text-base-content/60 mt-2">Create your account to connect with fellow alumni.</p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                className={`input input-bordered ${errors.name ? "input-error" : ""}`}
                {...register("name", {
                  required: "Full name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
              />
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.name.message}</span>
                </label>
              )}
            </div>

            {/* Contact Type Toggle */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className={`input input-bordered ${errors.contact ? "input-error" : ""}`}
                {...register("contact", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.contact && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.contact.message}</span>
                </label>
              )}
            </div>

            {/* Batch */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Batch</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Calendar size={20} />
                </span>
                <select
                  className={`input input-bordered w-full pl-10 ${errors.batch ? "input-error" : ""}`}
                  value={batchStart}
                  onChange={e => {
                    setBatchStart(Number(e.target.value));
                    const batchValue = `${e.target.value}-${Number(e.target.value) + 1}`;
                    setValue("batch", batchValue, { shouldValidate: true });
                  }}
                  style={{ appearance: 'none' }}
                >
                  {Array.from({ length: currentYear - 2010 }, (_, i) => currentYear - i - 1).map(year => (
                    <option key={year} value={year}>{year}-{year + 1}</option>
                  ))}
                </select>
                <input
                  type="hidden"
                  {...register("batch", {
                    required: "Batch is required",
                    validate: (value) => {
                      const match = value.match(/^(\d{4})-(\d{4})$/);
                      if (!match) return "Batch must be in format YYYY-YYYY";
                      const start = parseInt(match[1]);
                      const end = parseInt(match[2]);
                      if (end !== start + 1) return "Batch years must be consecutive";
                      if (start < 1950 || end > currentYear) return "Batch years out of range";
                      if (end > currentYear + 1) return "Batch cannot be in the future";
                      return true;
                    },
                  })}
                  value={`${batchStart}-${batchStart + 1}`}
                  readOnly
                />
              </div>
              {errors.batch && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.batch.message}</span>
                </label>
              )}
            </div>

            {/* Center */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Center</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Mumbai, Delhi, Bangalore"
                className={`input input-bordered ${errors.center ? "input-error" : ""}`}
                {...register("center", {
                  required: "Center is required",
                })}
              />
              {errors.center && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.center.message}</span>
                </label>
              )}
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className={`input input-bordered w-full pr-10 ${errors.password ? "input-error" : ""}`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                    validate: (value) => {
                      if (!/[A-Z]/.test(value)) return "Must include an uppercase letter";
                      if (!/[a-z]/.test(value)) return "Must include a lowercase letter";
                      if (!/[0-9]/.test(value)) return "Must include a digit";
                      if (!/[^A-Za-z0-9]/.test(value)) return "Must include a special character";
                      return true;
                    },
                  })}
                  onFocus={() => setShowChecklist(true)}
                  onBlur={() => setShowChecklist(false)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {showChecklist && (
                <ul className="mt-2 text-xs">
                  {passwordRules.map((rule, idx) => (
                    <li key={idx} className={rule.test(password) ? "text-green-600" : "text-red-600"}>
                      {rule.test(password) ? "✔" : "✖"} {rule.label}
                    </li>
                  ))}
                </ul>
              )}
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.password.message}</span>
                </label>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={`input input-bordered w-full pr-10 ${errors.confirmPassword ? "input-error" : ""}`}
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => value === password || "Passwords do not match",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`mt-1 text-xs ${passwordsMatch ? "text-green-600" : "text-red-600"}`}>
                  {passwordsMatch ? "✔ Passwords match" : "✖ Passwords do not match"}
                </div>
              )}
              {errors.confirmPassword && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.confirmPassword.message}</span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <span className="text-base-content/60">Already have an account? </span>
            <Link to="/login" className="link link-primary">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
