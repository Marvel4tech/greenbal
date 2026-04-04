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
    const subscription = body?.subscription;

    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return NextResponse.json(
        { error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || null;

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_agent: userAgent,
          platform: "ios_webpush",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to save subscription" },
      { status: 500 }
    );
  }
}