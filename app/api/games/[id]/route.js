import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { NextResponse } from "next/server";

// UPDATE game result
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { data, error } = await supabaseAdmin
            .from("games")
            .update({
                ...body,
            })
            .eq("id", id)
            .select("*")
            .single();

        if (error) throw error;

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
        return NextResponse(
            { success: false, message: error.message },
            { status: 500 }
        )
    }
}