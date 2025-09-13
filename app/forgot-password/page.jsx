'use client'


import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

const Page = () => {
    const supabase = createClient();
    const router = useRouter();

    // States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [email, setEmail] = useState("");

    // Functions
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Basic Email Validation
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address')
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            })

            if (error) {
                throw error
            }

            setSuccess("Password reset instructions sent to your email!")
            setEmail("")
        } catch (error) {
            setError(error.message || "Failed to send reset instructions")
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setEmail(e.target.value)
    }

  return (
    <div className=' h-full flex items-center justify-center px-4'>
        <div className='flex flex-col bg-black/10 w-full max-w-md border border-white/30 rounded-sm px-6 py-8 gap-6'>
            {/* Back button */}
            <Link href={'/login'} className=' className="flex items-center text-primary hover:underline mb-2'>
                <ArrowLeft size={16} className=' mr-2' />
                Back to Login
            </Link>

            {/* Header */}
            <div className='text-center'>
                <div className='flex justify-center mb-4'>
                    <Mail className='text-primary h-12 w-12' />
                </div>
                <h1 className='text-2xl font-semibold'>Reset Your Password</h1>
                <p className='text-gray-600 mt-2'>
                    Enter your email address and we'll send you instructions to reset your password.
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className=' bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
                    {error}
                </div>
            )}

            {/* Success message */}
            {success && (
                <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded'>
                    {success}
                </div>
            )}

            {/* Form */}
            <form className='flex flex-col gap-5' onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">
                        Email Address
                    </label>
                    <input 
                        type="email" 
                        id='email'
                        name='email'
                        value={email}
                        onChange={handleChange}
                        className='border-white/50 px-4 py-3 w-full border rounded-sm focus:outline-none focus:ring-2 focus:ring-primary'
                        placeholder='Enter your email'
                        required
                        disabled={loading}
                    />
                </div>
                <Button type='submit' className='w-full rounded-sm font-semibold py-3' disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Instructions"}
                </Button>
            </form>

            {/* Additional Help */}
            <div className='text-center text-sm text-gray-600'>
                <p>Don't have an account? </p>
                <Link href="/register" className="text-primary font-medium hover:underline">
                    Sign up here
                </Link>
            </div>
        </div>
    </div>
  )
}

export default Page
