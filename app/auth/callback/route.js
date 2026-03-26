import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const tempResponse = NextResponse.redirect(new URL("/processing", request.url))

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
            tempResponse.cookies.set(name, "", options)
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error

    return tempResponse
  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(new URL("/login?error=auth", request.url))
  }
}