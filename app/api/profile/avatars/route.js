import { NextResponse } from "next/server"
import { createServerClientWrapper } from "@/lib/supabase/server"

const ALLOWED_EXTS = ["jpg", "jpeg", "png", "webp"]

function extractStoragePathFromPublicUrl(url) {
  if (!url) return null

  const cleanUrl = url.split("?")[0]
  const marker = "/storage/v1/object/public/avatars/"
  const idx = cleanUrl.indexOf(marker)

  if (idx === -1) return null

  return cleanUrl.slice(idx + marker.length)
}

export async function POST(req) {
  try {
    const supabase = await createServerClientWrapper()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("avatar")

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (typeof file === "string") {
      return NextResponse.json({ error: "Invalid file upload" }, { status: 400 })
    }

    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    const ext = file.name?.split(".").pop()?.toLowerCase() || "jpg"

    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json(
        { error: "Only jpg, jpeg, png, and webp files are allowed" },
        { status: 400 }
      )
    }

    // Get existing avatar URL so we can delete old file
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()

    const oldPath = extractStoragePathFromPublicUrl(existingProfile?.avatar_url)

    // Use a unique file name every upload
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, bytes, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath)

    const avatarUrl = publicUrlData.publicUrl

    const { data: updatedProfile, error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id)
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Delete old file after successful update
    if (oldPath) {
      await supabase.storage.from("avatars").remove([oldPath])
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createServerClientWrapper()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()

    const oldPath = extractStoragePathFromPublicUrl(existingProfile?.avatar_url)

    if (oldPath) {
      await supabase.storage.from("avatars").remove([oldPath])
    }

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error" },
      { status: 500 }
    )
  }
}