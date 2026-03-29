import { redirect } from "next/navigation"
import { createServerClientWrapper } from "@/lib/supabase/server"
import SystemToolsClient from "@/components/SystemToolsClient"

export default async function ToolsPage() {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) redirect("/login")

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (adminError || adminProfile?.role !== "admin") {
    redirect("/")
  }

  return <SystemToolsClient />
}