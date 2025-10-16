import { createServerClientWrapper } from '@/lib/supabase/server';
import React from 'react'
import { ThemeToggle } from './theme-toggle';
import { UserIcon } from 'lucide-react';
import Link from 'next/link';
import { FaFutbol } from 'react-icons/fa';
import { redirect } from 'next/navigation';

function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
}

const DashboardNavbar = async () => {
    const supabase = await createServerClientWrapper();
    const { data: {user}, error: userError } = await supabase.auth.getUser() // get user in this case the admin

    if (!user || userError) {
        redirect('/login')
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        console.error('Profile fetch failed:', profileError)
        redirect('/register')
    }

    if (profile?.role !== 'admin') {
        redirect('/profile')
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
                    <h1 className=' text-xs sm:text-sm'>
                        {greeting}, <span className=' capitalize font-medium'>{profile.username} ({profile.role})</span>
                    </h1>
                </div>
                <ThemeToggle />
            </div> 
        </div>
    </header>
  )
}

export default DashboardNavbar