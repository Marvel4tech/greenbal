'use client'

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link';
import React, { useEffect, useState } from 'react'

const Page = () => {
    const supabase = createClient();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLoadingEmail, setIsLoadingEmail] = useState(true);

    useEffect(() => {
        // Get the email from the current session if available
        const getEmail = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setEmail(user.email)
                } else {
                    // Try to get email from localStorage as fallback
                    const storedEmail = localStorage.getItem('signup_email')
                    if (storedEmail) {
                        setEmail(storedEmail)
                    }
                }
            } catch (error) {
                console.error('Error fetching user email:', error)
            } finally {
                setIsLoadingEmail(false)
            }
        }

        getEmail()
    }, [supabase.auth])

    const resendVerification = async () => {
        if (!email) {
            setMessage('Error: No email address found')
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        })

        if (error) {
            setMessage('Error sending verification email: ' + error.message)
        } else {
            setMessage('Verification email sent successfully!')
        }
        setLoading(false)
    }

  return (
    <div className=' h-full flex items-center justify-center px-4'>
        <div className=' max-w-md w-full space-y-8 p-8 bg-black/10 border border-white/30 rounded-sm'>
            <h1 className="text-2xl font-bold text-center">Verify Your Email</h1>

            {isLoadingEmail ? (
                <p className="text-center">Loading...</p>
            ) : email ? (
                <p className="text-center">
                    We've sent a verification email to <strong>{email}</strong>. 
                    Please check your inbox and click the verification link.
                </p>
            ) : (
                <p className="text-center">
                    We've sent a verification email. Please check your inbox.
                </p>
            )}

            {message && (
                <div className={` p-3 rounded text-center ${message.includes('Error') ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <div className=' flex flex-col gap-4'>
                <Button onClick={resendVerification} disabled={loading} className={" w-full"}>
                    {loading ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                <Link href={'/login'} className="text-center text-primary hover:underline">
                    Back to Login
                </Link>
            </div>
        </div>
    </div>
  )
}

export default Page