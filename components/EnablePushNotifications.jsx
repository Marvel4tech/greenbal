"use client"

import { useEffect, useState } from "react"
import { getToken, onMessage } from "firebase/messaging"
import { getFirebaseMessagingSafe } from "@/lib/firebaseClient"

function isIOS() {
  if (typeof navigator === "undefined") return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export default function EnablePushNotifications() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const browserGranted =
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"

        const res = await fetch("/api/push/status", { cache: "no-store" })
        const json = await res.json()

        if (browserGranted && json?.enabled) {
          setEnabled(true)
          setMessage("Push notifications enabled.")
        }
      } catch (error) {
        console.error("Push status check failed:", error)
      } finally {
        setChecking(false)
      }
    }

    checkStatus()
  }, [])

  const enablePush = async () => {
    try {
      setLoading(true)
      setMessage("")

      if (!("Notification" in window)) {
        setMessage("This browser does not support notifications.")
        return
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      )

      const messaging = await getFirebaseMessagingSafe()

      if (!messaging) {
        if (isIOS()) {
          setMessage(
            "On iPhone/iPad, add Greenball360 to your Home Screen from Safari, open it from the Home Screen, then enable notifications there."
          )
        } else {
          setMessage("This browser does not support push notifications.")
        }
        return
      }

      const permission = await Notification.requestPermission()

      if (permission !== "granted") {
        setMessage("Notification permission was not granted.")
        return
      }

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      if (!token) {
        setMessage("Could not get a push token.")
        return
      }

      const res = await fetch("/api/push/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const json = await res.json()

      if (!res.ok) {
        setMessage(json?.error || "Failed to save push token.")
        return
      }

      onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload)
      })

      setEnabled(true)
      setMessage("Push notifications enabled.")
    } catch (error) {
      console.error("Enable push error:", error)
      setMessage(error?.message || "Something went wrong enabling notifications.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Push notifications
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
            Get notified when a new game is posted.
          </p>
        </div>

        <button
          onClick={enablePush}
          disabled={loading || checking || enabled}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50 transition"
        >
          {checking
            ? "Checking..."
            : loading
            ? "Enabling..."
            : enabled
            ? "Notifications Enabled"
            : "Enable notifications"}
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-sm text-gray-600 dark:text-white/70">
          {message}
        </p>
      ) : null}
    </div>
  )
}