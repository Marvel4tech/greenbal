import { NextResponse } from "next/server";
import { createServerClientWrapper } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { isProtectedSuperAdminEmail } from "@/lib/protectedAdmins";

async function requireAdmin() {
  const supabase = await createServerClientWrapper();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, username, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Forbidden");
  }

  return profile;
}

export async function PATCH(request) {
  try {
    const actingAdmin = await requireAdmin();
    const body = await request.json();

    const targetUserId = body?.userId;
    const nextRole = String(body?.role || "").trim();

    if (!targetUserId || !["admin", "user"].includes(nextRole)) {
      return NextResponse.json(
        { error: "userId and valid role are required" },
        { status: 400 }
      );
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, username, role")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (isProtectedSuperAdminEmail(targetUser.email) && nextRole !== "admin") {
      return NextResponse.json(
        {
          error: `${targetUser.email} is a protected super admin and cannot be changed to user`,
        },
        { status: 403 }
      );
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        role: nextRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId)
      .select("id, full_name, username, email, role, created_at, is_banned, is_deleted")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    const status =
      error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;

    return NextResponse.json({ error: error.message }, { status });
  }
}