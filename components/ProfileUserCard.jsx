"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "./ui/button"
import {
  Edit2Icon,
  Mail,
  MapPin,
  Phone,
  Landmark,
  User2,
  Trash2,
  Camera,
} from "lucide-react"

const emptyToDash = (v) => (v ? v : "—")

function Input({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  )
}

const ProfileUserCard = ({ profile, onProfileUpdated }) => {
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarLoaded, setAvatarLoaded] = useState(false)

  const avatarInputRef = useRef(null)

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    country: "",
    phone: "",
    gender: "",
    bank_name: "",
    bank_account: "",
    avatar_url: "",
  })

  useEffect(() => {
    if (!profile) return

    setForm({
      full_name: profile?.full_name || "",
      username: profile?.username || "",
      country: profile?.country || "",
      phone: profile?.phone || "",
      gender: profile?.gender || "",
      bank_name: profile?.bank_name || "",
      bank_account: profile?.bank_account || "",
      avatar_url: profile?.avatar_url || "",
    })
  }, [profile])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const initials = useMemo(() => {
    const name = profile?.full_name || profile?.username || profile?.email || "U"
    return name?.[0]?.toUpperCase?.() || "U"
  }, [profile])

  // Prefer the local updated form value first
  const avatarSrc = (form.avatar_url || profile?.avatar_url || "").trim()

  useEffect(() => {
    if (avatarSrc) {
      setAvatarLoaded(false)
    } else {
      setAvatarLoaded(true)
    }
  }, [avatarSrc])

  const saveProfile = async () => {
    try {
      setSaving(true)
      setError("")

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          username: form.username,
          country: form.country,
          phone: form.phone,
          gender: form.gender,
          bank_name: form.bank_name,
          bank_account: form.bank_account,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || "Failed to save profile")

      onProfileUpdated?.({
        ...data,
        avatar_url: form.avatar_url || data.avatar_url || "",
      })
      setOpen(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (file) => {
    if (!file) return

    try {
      setUploadingAvatar(true)
      setError("")

      const formData = new FormData()
      formData.append("avatar", file)

      const res = await fetch("/api/profile/avatars", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || "Failed to upload profile picture")

      const freshAvatarUrl = data.avatar_url
        ? `${data.avatar_url}?t=${Date.now()}`
        : ""

      setForm((prev) => ({
        ...prev,
        avatar_url: freshAvatarUrl,
      }))

      onProfileUpdated?.({
        ...data,
        avatar_url: freshAvatarUrl,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const removeAvatar = async () => {
    try {
      setUploadingAvatar(true)
      setError("")

      const res = await fetch("/api/profile/avatars", {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || "Failed to remove profile picture")

      setForm((prev) => ({
        ...prev,
        avatar_url: "",
      }))

      onProfileUpdated?.({
        ...data,
        avatar_url: "",
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="flex flex-col bg-white dark:bg-black/70 overflow-hidden">
      <div className="p-8">
        {!profile && <p className="text-sm text-gray-500">Loading profile…</p>}

        {profile && (
          <>
            <div className="flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="
                  group relative
                  w-28 sm:w-32 md:w-40
                  aspect-square
                  rounded-full
                  overflow-hidden
                  border-4 border-white dark:border-white/10
                  bg-gray-100 dark:bg-black
                  shadow-xl
                  transition-all duration-300
                  hover:scale-[1.03]
                  hover:shadow-[0_0_40px_rgba(34,197,94,0.35)]
                "
              >
                {avatarSrc ? (
                  <>
                    {!avatarLoaded && (
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-full" />
                    )}

                    <img
                      src={avatarSrc}
                      alt="Profile picture"
                      className={`w-full h-full object-cover rounded-full transition-opacity duration-300 ${
                        avatarLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => setAvatarLoaded(true)}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
                    <span className="text-4xl md:text-5xl font-bold text-primary">
                      {initials}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/35 flex items-center justify-center transition">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-semibold flex items-center gap-2 transition">
                    <Camera className="w-4 h-4" />
                    Change photo
                  </span>
                </div>
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadAvatar(e.target.files?.[0])}
              />

              <h2 className="mt-4 text-lg font-semibold">My profile</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                @{profile.username || "username-not-set"}
              </p>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                  Upload
                </Button>

                {avatarSrc && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-red-500 border-red-200 hover:bg-red-50"
                    onClick={removeAvatar}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </Button>
                )}
              </div>

              {uploadingAvatar && (
                <p className="mt-2 text-xs text-primary">
                  Uploading profile picture...
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-center">
              <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
                <Edit2Icon className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-200">
                  {emptyToDash(profile.email)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-200">
                  {emptyToDash(profile.phone)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-200">
                  {emptyToDash(profile.country)}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <User2 className="w-4 h-4" /> Full Name
                </p>
                <p className="text-sm font-semibold">{emptyToDash(profile.full_name)}</p>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500">Gender</p>
                <p className="text-sm font-semibold">{emptyToDash(profile.gender)}</p>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <Landmark className="w-4 h-4" /> Bank
                </p>
                <p className="text-sm font-semibold">{emptyToDash(profile.bank_name)}</p>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-gray-500">Account No</p>
                <p className="text-sm font-semibold">{emptyToDash(profile.bank_account)}</p>
              </div>
            </div>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>

      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
          <div
            className="
              w-full 
              md:w-1/2
              lg:w-1/2
              xl:w-2/5
              max-w-2xl
              min-w-[280px]
              rounded-2xl 
              bg-white dark:bg-gray-900 
              border border-gray-200 dark:border-gray-700 
              shadow-xl 
              overflow-hidden 
              flex flex-col
              max-h-[90vh]
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="font-semibold">Edit profile</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fill what you want — you can update anytime.
              </p>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1">
              <Input
                label="Full name"
                value={form.full_name}
                onChange={(v) => setForm((s) => ({ ...s, full_name: v }))}
              />
              <Input
                label="Username"
                value={form.username}
                onChange={(v) => setForm((s) => ({ ...s, username: v }))}
              />
              <Input
                label="Country"
                value={form.country}
                onChange={(v) => setForm((s) => ({ ...s, country: v }))}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
              />
              <Input
                label="Gender"
                value={form.gender}
                onChange={(v) => setForm((s) => ({ ...s, gender: v }))}
              />
              <Input
                label="Bank name"
                value={form.bank_name}
                onChange={(v) => setForm((s) => ({ ...s, bank_name: v }))}
              />
              <Input
                label="Bank account"
                value={form.bank_account}
                onChange={(v) => setForm((s) => ({ ...s, bank_account: v }))}
              />
            </div>

            {error && <p className="px-5 pb-2 text-sm text-red-500">{error}</p>}

            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="p-4 md:p-5 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileUserCard