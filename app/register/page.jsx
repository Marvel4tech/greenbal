'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const Page = () => {
  const supabase = createClient();
  const router = useRouter();

  // useStates
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({username: "", email: "", password: ""});
  const [showPassword, setShowPassword] = useState(false)

  // functions
  const passwordShowVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Store email in localStorage before redirecting
      localStorage.setItem('signup_email', formData.email);

      // Sign up user with supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        }
      })

      if (signUpError) {
        throw signUpError
      }
 
      // If signup successful, create a profile record via API
      if (authData.user) {
        const response = await fetch('/api/create-profile', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            userId: authData.user.id,
            username: formData.username,
            email: formData.email
          })
        })

        const result = await response.json()

        if(!response.ok) {
          throw new Error(result.error  || 'Failed to create profile')
        }
        
      }

      // Redirect to verification page or dashboard - in this case "verification page"
      router.push("/verify-email")
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className='h-screen'>
      <div className='h-full flex items-center justify-center px-4'>
        <div className='flex flex-col bg-black/10 w-full md:w-1/2 border border-white/30 rounded-sm px-5 py-5 gap-10'>
          {/* Back button - visible on all devices */}
          <div className="self-start -mt-2">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
          </div>

          <h1 className='text-2xl font-semibold text-center'>Create your Account</h1>

          {error && (
            <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
              {error}
            </div>
          )}

          <form className='w-full flex flex-col gap-5' onSubmit={handleSubmit} suppressHydrationWarning>
            <div>
              <label htmlFor="username">Username</label>
              <input
                name='username'
                id='username'
                type="text"
                value={formData.username}
                onChange={handleChange}
                className='border-white/50 px-4 py-2 w-full border rounded-sm'
                required
                suppressHydrationWarning
              />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input 
                name='email'
                id='email'
                type="email"
                value={formData.email}
                onChange={handleChange}
                className='border-white/50 px-4 py-2 w-full border rounded-sm'
                required
                suppressHydrationWarning
              />
            </div>
            <div className='relative'>
              <label htmlFor="password">Password</label>
              <div className='relative flex items-center'>
                <input 
                  name='password'
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className='border-white/50 px-4 py-2 w-full border rounded-sm pr-10'
                  required
                  suppressHydrationWarning
                />
                <button type='button' onClick={passwordShowVisibility} aria-label={showPassword ? 'Hide password' : 'Show password'} 
                className='absolute right-3 text-gray-500 hover:text-gray-700'>
                  {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
              </div>
            </div>
            <Button type='submit' className='w-full rounded-sm font-semibold'>
              {loading ? "Creating Account..." : "Register"}
            </Button>
          </form>
          <h1 className='self-center'>
            Have an Account? <span className='text-primary font-medium'><Link href={"/login"}>Login</Link></span>
          </h1>
        </div>
      </div>
    </div>
  )
}

export default Page