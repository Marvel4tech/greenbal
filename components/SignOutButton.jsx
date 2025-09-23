'use client'

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { LogOut } from "lucide-react";

export default function SignOutButton({ variant='default', className="" }) {
    const supabase = createClient();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh
        router.push('/')
    }

    return (
        <Button onClick={handleSignOut} variant={variant} className={className} aria-label="Sign out">
            <LogOut size={16} className=" mr-2" />
            Log Out 
        </Button>
    )
}