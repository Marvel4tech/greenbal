'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

const Page = () => {
  const router = useRouter()
  const supabase = createClient()

  const [message, setMessage] = useState('Setting up your account...')

  useEffect(() => {
    let mounted = true

    const run = async () => {
      try {
        setMessage('Checking your session...')

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.replace('/login')
          return
        }

        setMessage('Loading your profile...')

        const profileRes = await fetch('/api/profile', { cache: 'no-store' })
        const profileData = await profileRes.json()

        if (!profileRes.ok) {
          throw new Error(profileData?.error || 'Failed to load profile')
        }

        const referralCode = localStorage.getItem('pending_referral_code')

        if (referralCode) {
          setMessage('Applying referral bonus...')

          try {
            const referralRes = await fetch('/api/referrals/apply', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ referralCode }),
            })

            const referralData = await referralRes.json()

            // Whether success or already applied / invalid / etc,
            // clear local copy so it does not keep retrying forever
            console.log('Referral apply result:', referralData)
            localStorage.removeItem('pending_referral_code')
          } catch (err) {
            console.error('Referral apply failed:', err)
            localStorage.removeItem('pending_referral_code')
          }
        }

        if (!mounted) return

        if (profileData?.role === 'admin') {
          router.replace('/dashboard')
        } else {
          router.replace('/profile')
        }
      } catch (error) {
        console.error('Processing error:', error)
        router.replace('/login?error=processing')
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [router, supabase.auth])

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-8 text-center shadow-xl'>
        <div className='mx-auto h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin' />
        <h1 className='mt-5 text-xl font-semibold text-gray-900 dark:text-white'>
          Please wait
        </h1>
        <p className='mt-2 text-sm text-gray-600 dark:text-white/70'>
          {message}
        </p>
      </div>
    </div>
  )
}

export default Page