'use client'

import React, { useMemo } from "react"

// Adjust these to match your profiles table columns
const FIELDS = [
  { key: "full_name", label: "Full Name", weight: 15 },
  { key: "username", label: "Username", weight: 10 },
  { key: "country", label: "Country", weight: 10 },
  { key: "phone", label: "Phone", weight: 10 },
  { key: "gender", label: "Gender", weight: 10 },
  { key: "bank_name", label: "Bank Name", weight: 20 },
  { key: "bank_account", label: "Bank Account", weight: 20 },
  { key: "avatar_url", label: "Avatar", weight: 5 },
]

function isFilled(v) {
  if (v === null || v === undefined) return false
  if (typeof v === "string") return v.trim().length > 0
  return true
}

function getLevel(pct) {
  if (pct >= 90) return { label: "Elite", hint: "You’re set ✅" }
  if (pct >= 70) return { label: "Strong", hint: "Almost there 💪" }
  if (pct >= 40) return { label: "Good start", hint: "Keep going 🚀" }
  return { label: "Beginner", hint: "Complete your profile to unlock more 💡" }
}

export default function ProfileCompletionMeter({ profile }) {
  const { percent, missing } = useMemo(() => {
    const total = FIELDS.reduce((sum, f) => sum + f.weight, 0)
    const gained = FIELDS.reduce((sum, f) => {
      return sum + (isFilled(profile?.[f.key]) ? f.weight : 0)
    }, 0)

    const pct = total === 0 ? 0 : Math.round((gained / total) * 100)

    const miss = FIELDS.filter((f) => !isFilled(profile?.[f.key]))
      .map((f) => f.label)
      .slice(0, 3)

    return { percent: pct, missing: miss }
  }, [profile])

  const level = getLevel(percent)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/50 p-5 shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Profile Completion
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {level.label} • {level.hint}
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-extrabold text-primary">{percent}%</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            completed
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Missing hints */}
      {missing.length > 0 && (
        <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">
          Missing: <span className="font-medium">{missing.join(", ")}</span>
        </p>
      )}
      {missing.length === 0 && (
        <p className="mt-3 text-xs text-green-600 dark:text-green-400 font-medium">
          Your profile is complete
        </p>
      )}
    </div>
  )
}
