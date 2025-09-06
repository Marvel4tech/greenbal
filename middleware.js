import { NextResponse } from "next/server";
import { createServerClientWrapper } from "./lib/supabase/server";

export async function middleware(request) {
  const response = NextResponse.next()  // create response object
  const supabase = await createServerClientWrapper()  // get server supabase client
  const { data: { user } } = await supabase.auth.getUser()  // get current user

  // protect admin route which is the dashboard page
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url)) // redirect to login page if user is not authenticated
    }

    // check if user is not admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq("id", user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/profile', request.url)) // if not admin redirct user to profile
    }
  }

  // protect user route which is the profile page
  if (request.nextUrl.pathname.startsWith('/profile')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url)) // Redirect to login if not authenticated
    }

    // Check if user is admin and redirect to dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq("id", user.id)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url)) // redirect to dashboard since it's admin
    }

  }

  // redirect authenticated users away from auth pages
  if (['/login', '/register'].includes(request.nextUrl.pathname)) {
    if (user) {
      // Get user role to determine redirect destination
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const redirectPath = profile?.role === 'admin' ? '/dashboard' : '/profile'
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
  ]
}