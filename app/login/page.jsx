"use client"

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, User } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

const Page = () => {
  const supabase = createClient()

  // states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)

  const passwordShowVisibility = () => {
    setShowPassword(!showPassword)
  }

  // functions
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // 1. Sign in the User
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        throw signInError
      }


      // 2. Use window.location to force full page reload and trigger middleware
      window.location.href = '/profile'

    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className=' h-screen'>
      <div className=' h-full flex items-center justify-center px-4'>
        <div className=' flex flex-col bg-black/10 w-full md:w-1/2 border border-white/30 rounded-sm px-5 py-5 gap-10'>
          <div className=' self-center flex flex-col items-center mt-10 gap-5'>
            <User className=' text-primary' />
            <h1 className=' text-2xl font-semibold'>Login to your account</h1>
          </div>

          {/* ADD ERROR DISPLAY */}
          {error && (
            <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
              {error}
          </div>
          )}

          <form className=' w-full flex flex-col gap-5' onSubmit={handleSubmit} suppressHydrationWarning>
            <div>
              <label htmlFor="email">Email</label>
              <input 
                id='email'
                name='email'
                type="email"
                placeholder='Enter your email'
                defaultValue={formData.email}
                onChange={handleChange}
                className=' border-white/50 px-4 py-2 w-full border rounded-sm'
                required
                suppressHydrationWarning
              />
            </div>
            <div className=' relative'>
              <label htmlFor="password">Password</label>
              <div className=' relative flex items-center'>
                <input 
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your password'
                  value={formData.password}
                  onChange={handleChange}
                  className=' border-white/50 px-4 py-2 w-full border rounded-sm pr-10'
                  required
                  suppressHydrationWarning
                />
                <button type='button' onClick={passwordShowVisibility} className=' absolute right-3 text-gray-500 hover:text-gray-700' 
                aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <Button type='submit' disabled={loading} className=' w-full rounded-sm font-semibold'>
              {loading ? "Loggin in.." : "Login"}
            </Button>
          </form>

          <div className=' text-right'>
            <Link href={'/forgot-password'} className=' text-primary text-sm hover:underline'>
              Forgot password?
            </Link>
          </div>

          <h1 className=' self-center'>
            Don't have an account? <span className=' text-primary font-medium'><Link href={"/register"}>Register here</Link></span>
          </h1>
        </div>
      </div>
    </div>
  )
}

export default Page