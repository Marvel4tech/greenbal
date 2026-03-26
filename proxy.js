import { NextResponse } from "next/server"
import { createProxyClient } from "./lib/supabase/proxy"

export async function proxy(request) {
  const { supabase, response } = createProxyClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // redirect homepage if logged in
  if (request.nextUrl.pathname === "/") {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      const redirectPath =
        profile?.role === "admin" ? "/dashboard" : "/profile"

      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  // protect admin routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/profile", request.url))
    }
  }

  // protect user routes
  if (request.nextUrl.pathname.startsWith("/profile")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role === "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // redirect logged-in users away from auth pages
  if (["/login", "/signup"].includes(request.nextUrl.pathname)) {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      const redirectPath =
        profile?.role === "admin" ? "/dashboard" : "/profile"

      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/profile/:path*",
    "/login",
    "/signup",
  ],
}