import { createServerClientWrapper } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const Page = async () => {
  const supabase = await createServerClientWrapper() // Create server-side Supabase client
  const { data: { user }, error: userError } = await supabase.auth.getUser() // Get the currently logged-in user

  if (userError || !user) {
    redirect('/login') // Redirect if not logged in
  }

  // Fetch the user's profile securely
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError?.message)
    redirect('/login')  // Redirect if profile is missing or fetch fails
  }

  // Render profile
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Your Profile</h1>
      <p>Welcome, {user.email}!</p>
      <div className="mt-4">
        <p><strong>Username:</strong> {profile.username}</p>
        <p><strong>Role:</strong> {profile.role}</p>
      </div>
    </div>
  )
}

export default Page
