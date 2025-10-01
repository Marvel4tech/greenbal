import Link from 'next/link'
import React from 'react'
import { FaFutbol } from 'react-icons/fa'
import { ThemeToggle } from './theme-toggle'
import { UserIcon } from 'lucide-react'
import { createServerClientWrapper } from '@/lib/supabase/server'

// greeting function
function getGreeting() {
    const hour = new Date().getHours();

    if(hour < 12) return 'Good morning'
    if(hour < 18) return 'Good afternoon'
    return 'Good evening'
}

const ProfileNavbar = async () => {
    const supabase = await createServerClientWrapper()
    const { data: { user }, error: userError } = await supabase.auth.getUser() // get user

    if (userError || !user) {
        redirect('/login')
    }

    const { data: profile, error: profileError } = await supabase // get profile username and role
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('Profile fetch error:', profileError?.message)
        redirect('/login')
    }

    const greeting = getGreeting()

  return (
    <header className='border-b border-primary px-4 lg:px-0'>
        <div className=' h-20 max-w-7xl mx-auto flex justify-between items-center'>
            <Link href={"/"}>
                <FaFutbol className=' text-5xl text-primary' />
            </Link>
            <div className=' flex items-center gap-5 md:gap-10'>
                <div className=' flex items-end gap-2'>
                    <UserIcon className=' w-5 h-5 md:w-8 md:h-8' />
                    <h1 className=' text-sm'>{greeting}, <span className=' capitalize font-medium'>{profile.username}</span></h1>
                </div>
                <ThemeToggle />
            </div> 
        </div>
    </header>
  )
}

export default ProfileNavbar