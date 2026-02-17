'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Key } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const Page = () => {
  const supabase = createClient()
  const router = useRouter()

  // States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })

  // Check if user has a valid session
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login?error=invalid_session')
      }
    }

    checkSession()
  }, [router, supabase])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      })

      if (error) throw error

      setSuccess('Password updated successfully! Redirecting to login...')

      setTimeout(() => {
        router.push('/login?message=password_updated')
      }, 2000)
    } catch (error) {
      setError(error?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="flex flex-col bg-black/10 w-full max-w-md border border-white/30 rounded-sm px-6 py-8 gap-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Key className="text-primary h-12 w-12" />
          </div>
          <h1 className="text-2xl font-semibold">Set New Password</h1>
          <p className="text-gray-600 mt-2">Please enter your new password below.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="border-white/50 px-4 py-3 w-full border rounded-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter new password"
              minLength={6}
              required
              disabled={loading}
              suppressHydrationWarning
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={loading}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="border-white/50 px-4 py-3 w-full border rounded-sm pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Confirm new password"
              minLength={6}
              required
              disabled={loading}
              suppressHydrationWarning
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={loading}
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-sm font-semibold py-3 mt-2">
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-primary text-sm hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Page
