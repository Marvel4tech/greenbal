import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function GET(request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (!code) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        // Use a temporary response for cookie operations
        const tempResponse = NextResponse.redirect(new URL('/processing', request.url))
        
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return request.cookies.get(name)?.value
                    },
                    set(name, value, options) {
                        tempResponse.cookies.set(name, value, options)
                    },
                    remove(name, options) {
                        tempResponse.cookies.set(name, '', options)
                    },
                },
            }
        )

        // Exchange code for session (this sets cookies on tempResponse)
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error

        // Get user and role
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No user found')

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (!profile) throw new Error('No profile found')

        // Create final redirect with the same cookies
        const redirectPath = profile.role === "admin" ? "/dashboard" : "/profile"
        const finalResponse = NextResponse.redirect(new URL(redirectPath, request.url))
        
        // Copy cookies from temp response to final response
        tempResponse.cookies.getAll().forEach(cookie => {
            finalResponse.cookies.set(cookie)
        })

        return finalResponse

    } catch (error) {
        console.error("Auth callback error:", error)
        return NextResponse.redirect(new URL("/login?error=auth", request.url))
    }
}