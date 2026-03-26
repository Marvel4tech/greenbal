import { NextResponse } from "next/server"
import { runSettlement } from "@/app/api/admin/weekly-settlement/run/route"

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization")

    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ error: "CRON_SECRET is missing" }, { status: 500 })
    }

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await runSettlement({ adminUserId: null })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    )
  }
}