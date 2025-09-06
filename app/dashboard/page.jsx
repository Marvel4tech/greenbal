
import { createServerClientWrapper } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import React from 'react'

const Page = async () => {
    const supabase = await createServerClientWrapper()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // confirm if user is really an admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "admin") {
        redirect("/profile") // Redirect non-admins to profile
    }

  return (
    <div className=' p-8'>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p>Welcome, {user.email}! You have admin privileges.</p>
    </div>
  )
}

export default Page