import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        // Debug: Check if environment variables are loaded
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
        console.log('Service role key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length)

        // Check if service key is available
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json(
                { error: 'service role key not configured' },
                { status: '500' }
            )
        }


        // Create Supabase client with service role key
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        const { userId, username, email } = await request.json()

        console.log('Creating profile for:', { userId, username, email })

        // Insert profile - service role bypasses all RLS
        const { error } = await supabase
            .from("profiles")
            .insert([
                {
                    id: userId,
                    username: username,
                    email: email,
                    role: "user"
                }
            ])
            .select() // Add .select() to get returned data

        if (error) {
            console.error('Profile creation error:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }
        
        console.log('Profile created successfully:')
        return NextResponse.json({ success: true })  

    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}