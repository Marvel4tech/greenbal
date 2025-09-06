import { createServerClientWrapper } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (code) {

        const supabase = await createServerClientWrapper()

        // 1. Exchange the auth code for a session
        const { data: {session}, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            console.error("Auth exchange error:", error.message)
            return NextResponse.redirect(new URL("/login?error=auth", request.url))
        }

        // 2. Fetch the user's profile (to check role)
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()

        if (profileError) {
            console.error("Profile fetch error:", profileError.message)
            return NextResponse.redirect(new URL("/login?error=profile", request.url))
        }

        // and redirect based on role
        const redirectPath = profile.role === "admin" ? "/dashboard" : "/profile"
        return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // Default fallback → login page
    return NextResponse.redirect(new URL('/login', request.url))
}