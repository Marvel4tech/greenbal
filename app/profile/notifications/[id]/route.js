import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerClientWrapper } from "@/lib/supabase/server";

export async function GET(request, { params }) {
  const supabase = await createServerClientWrapper();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { id } = await params;

  const { data: notification, error } = await supabase
    .from("notifications")
    .select("id, user_id, link, is_read")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !notification) {
    return NextResponse.redirect(
      new URL("/profile/notifications", request.url)
    );
  }

  if (!notification.is_read) {
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to mark notification as read:", updateError.message);
    }

    revalidatePath("/profile", "layout");
    revalidatePath("/profile/notifications");
  }

  const target = notification.link || "/profile/notifications";

  return NextResponse.redirect(new URL(target, request.url));
}