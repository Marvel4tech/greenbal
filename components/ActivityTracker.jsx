"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export default function ActivityTracker() {
  const pathname = usePathname()
  const heartbeatRef = useRef(null)

  useEffect(() => {
    const send = async (action = "heartbeat", message = null) => {
      try {
        await fetch("/api/activity/ping", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            path: pathname,
            message,
          }),
          keepalive: true,
        })
      } catch {}
    }

    send("route_open")

    heartbeatRef.current = setInterval(() => {
      send("heartbeat")
    }, 60 * 1000)

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [pathname])

  return null
}