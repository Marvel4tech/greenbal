import { NextResponse } from "next/server";
import { createServerClientWrapper } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

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

export async function GET() {
  try {
    await requireAdmin();

    const { data: settings, error } = await supabaseAdmin
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      settings:
        settings || {
          id: 1,
          app_name: "greenball360",
          maintenance_mode: false,
          daily_prediction_limit: 5,
          points_for_correct: 3,
          points_for_draw: 1,
          points_for_wrong: 0,
        },
    });
  } catch (error) {
    const status =
      error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;

    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const payload = {
      id: 1,
      app_name: String(body?.appName || "greenball360").trim(),
      maintenance_mode: Boolean(body?.maintenanceMode),
      daily_prediction_limit: Number(body?.dailyPredictionLimit ?? 5),
      points_for_correct: Number(body?.pointsForCorrect ?? 3),
      points_for_draw: Number(body?.pointsForDraw ?? 1),
      points_for_wrong: Number(body?.pointsForWrong ?? 0),
      updated_at: new Date().toISOString(),
      updated_by: admin.id,
    };

    if (!payload.app_name) {
      return NextResponse.json({ error: "App name is required" }, { status: 400 });
    }

    if (
      [
        payload.daily_prediction_limit,
        payload.points_for_correct,
        payload.points_for_draw,
        payload.points_for_wrong,
      ].some((n) => Number.isNaN(n))
    ) {
      return NextResponse.json(
        { error: "All numeric settings must be valid numbers" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from("system_logs").insert({
      user_id: admin.id,
      email: admin.email || null,
      username: admin.username || null,
      role: "admin",
      action: "settings_updated",
      message: `${admin.username || admin.email || admin.id} updated app settings`,
      path: "/dashboard/settings",
      metadata: payload,
    });

    return NextResponse.json({ success: true, settings: data });
  } catch (error) {
    const status =
      error.message === "Unauthorized" ? 401 : error.message === "Forbidden" ? 403 : 500;

    return NextResponse.json({ error: error.message }, { status });
  }
}