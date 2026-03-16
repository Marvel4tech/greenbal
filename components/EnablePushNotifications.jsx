"use client"

import { useState } from "react"
import { getToken, onMessage } from "firebase/messaging"
import { getFirebaseMessagingSafe } from "@/lib/firebaseClient"

export default function EnablePushNotifications() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const enablePush = async () => {
    try {
      setLoading(true)
      setMessage("")

      if (!("Notification" in window)) {
        setMessage("This browser does not support notifications.")
        return
      }

      console.log("VAPID key exists:", !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY)
      console.log("Current notification permission:", Notification.permission)

      const permission = await Notification.requestPermission()
      console.log("Permission result:", permission)

      if (permission !== "granted") {
        setMessage("Notification permission was not granted.")
        return
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      )
      console.log("Service worker registered:", registration)

      const messaging = await getFirebaseMessagingSafe()
      console.log("Messaging instance:", messaging)

      if (!messaging) {
        setMessage("Push notifications are not supported in this browser.")
        return
      }

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      })

      console.log("FCM token:", token)

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
      console.log("Register token response:", { status: res.status, json })

      if (!res.ok) {
        setMessage(json?.error || "Failed to save push token.")
        return
      }

      onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload)
      })

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
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Enabling..." : "Enable notifications"}
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