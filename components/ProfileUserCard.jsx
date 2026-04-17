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

function Input({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/30 px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
      />
    </label>
  )
}

function InfoRow({ icon: Icon, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 px-3 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-200 break-all">
        {emptyToDash(value)}
      </span>
    </div>
  )
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {Icon ? <Icon className="w-4 h-4" /> : null}
        <span>{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">
        {emptyToDash(value)}
      </p>
    </div>
  )
}

const ProfileUserCard = ({ profile, onProfileUpdated }) => {
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

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

  const avatarSrc = (form.avatar_url || profile?.avatar_url || "").trim()

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

      setForm((prev) => ({
        ...prev,
        avatar_url: data.avatar_url || "",
      }))

      onProfileUpdated?.(data)
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
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-black/70">
      <div className="relative border-b border-gray-200 dark:border-white/10 bg-gradient-to-br from-primary/10 via-white to-white dark:from-primary/10 dark:via-black/40 dark:to-black/40 px-6 py-8 sm:px-8">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

        {!profile && <p className="text-sm text-gray-500">Loading profile…</p>}

        {profile && (
          <div className="relative flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="group relative h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 overflow-hidden rounded-full border-4 border-white dark:border-white/10 bg-gray-100 dark:bg-black shadow-2xl transition hover:scale-[1.02]"
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Profile picture"
                  className="h-full w-full rounded-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
                  <span className="text-4xl md:text-5xl font-bold text-primary">
                    {initials}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/35">
                <span className="flex items-center gap-2 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100">
                  <Camera className="h-4 w-4" />
                  Change
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

            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              {profile.full_name || "My profile"}
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              @{profile.username || "username-not-set"}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                className="gap-2 rounded-full"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                <Camera className="w-4 h-4" />
                Upload
              </Button>

              {avatarSrc && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 rounded-full text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={removeAvatar}
                  disabled={uploadingAvatar}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                className="gap-2 rounded-full"
                onClick={() => setOpen(true)}
              >
                <Edit2Icon className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>

            {uploadingAvatar && (
              <p className="mt-3 text-xs font-medium text-primary">
                Uploading profile picture...
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8">
        {profile && (
          <>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow icon={Mail} value={profile.email} />
              <InfoRow icon={Phone} value={profile.phone} />
              <InfoRow icon={MapPin} value={profile.country} />
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailCard icon={User2} label="Full Name" value={profile.full_name} />
              <DetailCard label="Gender" value={profile.gender} />
              <DetailCard icon={Landmark} label="Bank" value={profile.bank_name} />
              <DetailCard label="Account No" value={profile.bank_account} />
            </div>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl min-w-[280px] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit profile
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Update your details anytime.
              </p>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              <Input
                label="Full name"
                value={form.full_name}
                placeholder="Enter full name"
                onChange={(v) => setForm((s) => ({ ...s, full_name: v }))}
              />
              <Input
                label="Username"
                value={form.username}
                placeholder="Enter username"
                onChange={(v) => setForm((s) => ({ ...s, username: v }))}
              />
              <Input
                label="Country"
                value={form.country}
                placeholder="Enter country"
                onChange={(v) => setForm((s) => ({ ...s, country: v }))}
              />
              <Input
                label="Phone"
                value={form.phone}
                placeholder="Enter phone number"
                onChange={(v) => setForm((s) => ({ ...s, phone: v }))}
              />
              <Input
                label="Gender"
                value={form.gender}
                placeholder="Enter gender"
                onChange={(v) => setForm((s) => ({ ...s, gender: v }))}
              />
              <Input
                label="Bank name"
                value={form.bank_name}
                placeholder="Enter bank name"
                onChange={(v) => setForm((s) => ({ ...s, bank_name: v }))}
              />
              <Input
                label="Bank account"
                value={form.bank_account}
                placeholder="Enter account number"
                onChange={(v) => setForm((s) => ({ ...s, bank_account: v }))}
              />
            </div>

            {error && <p className="px-5 pb-2 text-sm text-red-500">{error}</p>}

            <div className="sticky bottom-0 border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-end gap-2 p-4 md:p-5">
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