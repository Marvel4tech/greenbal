import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit") || 12)

    const supabase = await createServerClientWrapper()

    const { data, error } = await supabase
      .from("news_posts")
      .select("id, title, slug, cover_image_url, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch news" },
      { status: 500 }
    )
  }
}