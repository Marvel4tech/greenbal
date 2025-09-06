'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
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

  // functions
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

      /* 
      // If signup successful, create a profile record. (However I wont use this because i set up a trigger in supabase,
         thus when a new user sign up it will by default copy the details to the profile in database).

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              username: formData.username,
              email: formData.email
            }
          ])

        if (profileError) {
          throw profileError
        }
      } */

      // Redirect to verification page or dashboard - in this case "verification page"
      router.push("/verify-email")
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className=' h-full flex items-center justify-center px-4'>
      <div className=' flex flex-col bg-black/10 w-full md:w-1/2 border border-white/30 rounded-sm px-5 py-5 gap-10'>
        <h1 className=' text-2xl font-semibold mt-10'>Create your Account</h1>

        {error && (
          <div className=' bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
            {error}
          </div>
        )}

        <form className=' w-full flex flex-col gap-5' onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Username</label>
            <input
              name='username'
              id='username'
              type="text"
              value={formData.username}
              onChange={handleChange}
              className=' border-white/50 px-4 py-2 w-full border rounded-sm'
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
              className=' border-white/50 px-4 py-2 w-full border rounded-sm'
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input 
              name='password'
              id='password'
              type="password"
              value={formData.password}
              onChange={handleChange}
              className=' border-white/50 px-4 py-2 w-full border rounded-sm'
            />
          </div>
          <Button type='submit' className=' w-full rounded-sm font-semibold'>
            {loading ? "Creating Account..." : "Register"}
          </Button>
        </form>
        <h1 className=' self-center'>
          Have an Account? <span className=' text-primary font-medium'><Link href={"/login"}>Login</Link></span>
        </h1>
      </div>
    </div>
  )
}

export default Page