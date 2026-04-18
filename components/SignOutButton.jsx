'use client'

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { LogOut } from "lucide-react"

export default function SignOutButton({ variant = 'default', className = "" }) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Sign out error:", error.message)
      return
    }

    router.replace("/")
    router.refresh()
  }

  return (
    <Button
      onClick={handleSignOut}
      variant={variant}
      className={className}
      aria-label="Sign out"
    >
      <LogOut size={16} />
      Log Out
    </Button>
  )
}