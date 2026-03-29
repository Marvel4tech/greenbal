import { NextResponse } from "next/server";
import { createServerClientWrapper } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

const PROTECTED_SUPER_ADMIN_EMAIL = "marvel4tech@gmail.com";

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
    .single();

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
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (
      targetUser.email &&
      targetUser.email.toLowerCase() === PROTECTED_SUPER_ADMIN_EMAIL &&
      nextRole !== "admin"
    ) {
      return NextResponse.json(
        { error: `${PROTECTED_SUPER_ADMIN_EMAIL} cannot be changed to user` },
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
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabaseAdmin.from("system_logs").insert({
      user_id: actingAdmin.id,
      email: actingAdmin.email || null,
      username: actingAdmin.username || null,
      role: "admin",
      action: "role_changed",
      message: `${actingAdmin.username || actingAdmin.email || actingAdmin.id} changed ${targetUser.email || targetUser.id} role to ${nextRole}`,
      path: "/dashboard/settings",
      metadata: {
        targetUserId,
        targetEmail: targetUser.email || null,
        previousRole: targetUser.role,
        nextRole,
      },
    });

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