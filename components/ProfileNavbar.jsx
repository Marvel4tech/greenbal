import Link from 'next/link'
import React from 'react'
import { FaFutbol } from 'react-icons/fa'
import { ThemeToggle } from './theme-toggle'
import { UserIcon } from 'lucide-react'
import { createServerClientWrapper } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const ProfileNavbar = async () => {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, role, avatar_url')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  if (profile.role !== 'user') {
    redirect('/dashboard')
  }

  const { count: unreadCount, error: notificationError } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (notificationError) {
    console.error('Notification count fetch error:', notificationError.message)
  }

  const greeting = getGreeting()

  return (
    <header className="border-b border-primary px-4 lg:px-0">
      <div className="h-20 max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/">
          <FaFutbol className="text-5xl text-primary" />
        </Link>

        <div className="flex items-center gap-5 md:gap-10">
          <div className="flex items-center gap-2">
            <Link href="/profile/notifications" className="relative block">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-8 h-8 md:w-10 md:h-10 border border-primary"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-primary flex items-center justify-center">
                  <UserIcon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              )}

              {Number(unreadCount) > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] md:text-xs flex items-center justify-center font-bold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            <h1 className="text-sm">
              {greeting},{' '}
              <span className="capitalize font-medium">{profile.username}</span>
            </h1>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default ProfileNavbar