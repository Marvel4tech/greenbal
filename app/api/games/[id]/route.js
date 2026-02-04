import { scoreGame } from "@/lib/scoring/scoreGame";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { NextResponse } from "next/server";

// UPDATE game result
export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();

        const allowedResults = new Set(["homeWin", "draw", "awayWin"]);

        const { data, error } = await supabaseAdmin
            .from("games")
            .update({
                ...body,
            })
            .eq("id", id)
            .select("*")
            .single();

        if (error) throw error;

        // Trigger scoring ONLY when game is finished + valid result is provided
        if (data.status === "finished" && data.result && allowedResults.has(data.result)) {
            const scoring = await scoreGame(id);

            return NextResponse.json({ success: true, data, scoring })
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.log("Error updating game:", error.message)
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        )
    }
}

// DELETE a game
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from("games")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Game deleted" })
    } catch (error) {
        console.error("Error deleting game:", error.message);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        )
    }
}