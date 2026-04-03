import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClientWrapper } from "@/lib/supabase/server";

export async function POST(request, { params }) {
  const supabase = await createServerClientWrapper();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { id } = await params;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("type", "admin_announcement")
    .eq("is_read", false);

  if (error) {
    console.error("Failed to mark announcement as read:", error.message);
  }

  revalidatePath("/profile", "layout");
  revalidatePath("/profile/notifications");

  return NextResponse.json({ success: true });
}