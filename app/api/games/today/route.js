import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
    // Use UTC day boundaries (matches your timestamptz)
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

    const { data, error } = await supabaseAdmin
        .from("games")
        .select("*")
        .gte("match_time", start.toISOString())
        .lt("match_time", end.toISOString())
        .order("match_time", { ascending: true });

    if(error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data); 

}
