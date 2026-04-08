import { NextResponse } from "next/server";
import { createServerClientWrapper } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function POST(request) {
  try {
    const supabase = await createServerClientWrapper();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { error: "Missing FCM token" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || null;

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          fcm_token: token,
          user_agent: userAgent,
          platform: "fcm",
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "fcm_token" }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || "Failed to save FCM token",
      },
      { status: 500 }
    );
  }
}