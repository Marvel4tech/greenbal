"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import TiptapEditor from "@/components/dashboard/TiptapEditor"
import { ImagePlus, UploadCloud, X } from "lucide-react"

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function getFileExt(filename = "") {
  return filename.includes(".") ? filename.split(".").pop().toLowerCase() : ""
}

function getStoragePathFromUrl(url) {
  if (!url) return null
  const marker = "/storage/v1/object/public/news-images/"
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(url.slice(idx + marker.length))
}

export default function NewsPostForm({
  categories: initialCategories,
  initialData = null,
  mode = "create",
}) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef(null)

  const [categories, setCategories] = useState(initialCategories || [])
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategorySlug, setNewCategorySlug] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [creatingCategory, setCreatingCategory] = useState(false)

  const [title, setTitle] = useState(initialData?.title || "")
  const [slug, setSlug] = useState(initialData?.slug || "")
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "")
  const [content, setContent] = useState(initialData?.content || "<p>Start writing...</p>")
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image_url || "")
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "")
  const [status, setStatus] = useState(initialData?.status || "draft")
  const [featured, setFeatured] = useState(initialData?.featured || false)
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title || "")
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description || "")
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [previewUrl, setPreviewUrl] = useState(initialData?.cover_image_url || "")
  const [submitAction, setSubmitAction] = useState("draft")

  const isEdit = mode === "edit"

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const acceptedTypes = useMemo(
    () => ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    []
  )

  const handleFileSelected = (file) => {
    setError("")
    if (!file) return

    if (!acceptedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and WEBP files are allowed.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.")
      return
    }

    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }

    setCoverImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  async function uploadCoverImage(file, userId, postSlug) {
    if (!file) return coverImageUrl || null

    const ext = getFileExt(file.name) || "jpg"
    const safeSlug = slugify(postSlug || title || "news-image")
    const filePath = `${userId}/${safeSlug}-${Date.now()}.${ext}`

    setUploadingImage(true)

    const { error: uploadError } = await supabase.storage
      .from("news-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      setUploadingImage(false)
      throw uploadError
    }

    const { data } = supabase.storage
      .from("news-images")
      .getPublicUrl(filePath)

    setUploadingImage(false)

    return data?.publicUrl || null
  }

  async function maybeDeleteOldImage(oldUrl, newUrl) {
    if (!oldUrl || !newUrl || oldUrl === newUrl) return

    const oldPath = getStoragePathFromUrl(oldUrl)
    if (!oldPath) return

    await supabase.storage.from("news-images").remove([oldPath])
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")

    try {
      setCreatingCategory(true)

      const finalName = newCategoryName.trim()
      const finalSlug = newCategorySlug.trim() || slugify(finalName)

      if (!finalName) {
        throw new Error("Category name is required.")
      }

      const { data, error: insertError } = await supabase
        .from("news_categories")
        .insert({
          name: finalName,
          slug: finalSlug,
          description: newCategoryDescription.trim() || null,
        })
        .select("id, name, slug")
        .single()

      if (insertError) throw insertError

      const updatedCategories = [...categories, data].sort((a, b) =>
        a.name.localeCompare(b.name)
      )

      setCategories(updatedCategories)
      setCategoryId(data.id)
      setNewCategoryName("")
      setNewCategorySlug("")
      setNewCategoryDescription("")
      setShowCategoryForm(false)
      setMessage("Category created and selected successfully.")
    } catch (err) {
      setError(err.message || "Failed to create category.")
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("You must be logged in.")

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError) throw profileError

      const finalAuthorName = profileData?.username || "GreenBall360"
      const finalSlug = slug || slugify(title)
      const finalStatus = submitAction === "publish" ? "published" : "draft"

      let finalCoverImageUrl = coverImageUrl || null

      if (coverImageFile) {
        finalCoverImageUrl = await uploadCoverImage(
          coverImageFile,
          user.id,
          finalSlug
        )
      }

      const payload = {
        title,
        slug: finalSlug,
        excerpt,
        content,
        cover_image_url: finalCoverImageUrl,
        category_id: categoryId || null,
        author_name: finalAuthorName,
        status: finalStatus,
        featured,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        published_at:
          finalStatus === "published"
            ? initialData?.published_at || new Date().toISOString()
            : null,
      }

      let dbError = null

      if (isEdit) {
        const previousUrl = initialData?.cover_image_url || null

        const { error } = await supabase
          .from("news_posts")
          .update(payload)
          .eq("id", initialData.id)

        dbError = error

        if (!dbError && coverImageFile && finalCoverImageUrl) {
          await maybeDeleteOldImage(previousUrl, finalCoverImageUrl)
        }
      } else {
        const { error } = await supabase
          .from("news_posts")
          .insert({
            ...payload,
            author_id: user.id,
          })

        dbError = error
      }

      if (dbError) throw dbError

      setStatus(finalStatus)

      setMessage(
        finalStatus === "published"
          ? isEdit
            ? "Post updated and published successfully."
            : "Post published successfully."
          : isEdit
          ? "Draft updated successfully."
          : "Draft saved successfully."
      )

      router.push("/dashboard/news")
      router.refresh()
    } catch (err) {
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
      setUploadingImage(false)
    }
  }

  const primaryLoadingText =
    loading || uploadingImage
      ? uploadingImage
        ? "Uploading image..."
        : submitAction === "publish"
        ? "Publishing..."
        : "Saving draft..."
      : ""

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200/70 bg-white p-6 md:p-8 shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      <div className="grid gap-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!slug && !isEdit) setSlug(slugify(e.target.value))
            }}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-black/50"
            placeholder="Enter article title"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-black/50"
            placeholder="article-slug"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-black/50"
            placeholder="Short summary for cards and SEO"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Content</label>
          <TiptapEditor
            value={content}
            onChange={setContent}
            articleSlug={slug || title || "news-article"}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
            Press Enter to create a new paragraph. It will appear as a proper paragraph on the live article page.
          </p>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">Cover Image</label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
          />

          <div
            onDragEnter={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setDragActive(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
              handleFileSelected(e.dataTransfer.files?.[0] || null)
            }}
            className={`rounded-xl border-2 border-dashed p-6 transition ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 bg-gray-50 dark:border-white/10 dark:bg-black/30"
            }`}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <UploadCloud className="h-6 w-6" />
              </div>

              <p className="text-base font-semibold text-gray-900 dark:text-white">
                Drag and drop your cover image here
              </p>

              <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
                JPG, PNG, or WEBP. Maximum file size: 5MB.
              </p>

              <button
                type="button"
                onClick={openFilePicker}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:bg-black/40 dark:text-white/80 dark:hover:bg-white/10"
              >
                <ImagePlus className="h-4 w-4" />
                Choose Image
              </button>
            </div>
          </div>

          {coverImageFile && (
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-gray-700 dark:text-white/80">
              Selected file: <span className="font-semibold">{coverImageFile.name}</span>
            </div>
          )}

          {previewUrl && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-black/30">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Cover Preview</p>

                <button
                  type="button"
                  onClick={() => {
                    if (previewUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(previewUrl)
                    }
                    setCoverImageFile(null)
                    setPreviewUrl("")
                    setCoverImageUrl("")
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-black/40 dark:text-white/80 dark:hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <img
                src={previewUrl}
                alt="Cover preview"
                className="h-56 w-full rounded-xl object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium">Category</label>

            <button
              type="button"
              onClick={() => setShowCategoryForm((v) => !v)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {showCategoryForm ? "Close" : "Create category"}
            </button>
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-black/50"
          >
            <option value="">
              {categories?.length ? "Select category" : "No categories found"}
            </option>

            {(categories || []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-gray-500 dark:text-white/50">
            Example categories: Match Preview, Transfer News, Analysis, Team News.
          </p>

          {showCategoryForm && (
            <div className="mt-4 rounded-xl border border-gray-200/70 bg-gray-50 p-4 dark:border-white/10 dark:bg-black/30">
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">New Category Name</label>
                  <input
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value)
                      if (!newCategorySlug) {
                        setNewCategorySlug(slugify(e.target.value))
                      }
                    }}
                    placeholder="e.g. Transfer News"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-black/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">New Category Slug</label>
                  <input
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(slugify(e.target.value))}
                    placeholder="e.g. transfer-news"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-black/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Description</label>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    rows={3}
                    placeholder="Short description for this category"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-black/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={creatingCategory}
                  className="w-fit rounded-xl bg-primary px-5 py-2.5 font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
                >
                  {creatingCategory ? "Creating..." : "Create and Select Category"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Current Status</label>
            <input
              value={status}
              readOnly
              className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 outline-none dark:border-white/10 dark:bg-black/30 capitalize"
            />
          </div>

          <div className="flex items-center gap-3 pt-8">
            <input
              id="featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="featured" className="text-sm font-medium">
              Mark as featured post
            </label>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">SEO Title</label>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-black/50"
            placeholder="Optional SEO title"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">SEO Description</label>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-black/50"
            placeholder="Optional SEO description"
          />
        </div>

        {message && (
          <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={loading || uploadingImage}
            onClick={() => setSubmitAction("draft")}
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-100 disabled:opacity-60 dark:border-white/10 dark:bg-black/40 dark:text-white dark:hover:bg-white/10"
          >
            {loading && submitAction === "draft"
              ? primaryLoadingText
              : isEdit
              ? "Save Draft"
              : "Save as Draft"}
          </button>

          <button
            type="submit"
            disabled={loading || uploadingImage}
            onClick={() => setSubmitAction("publish")}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && submitAction === "publish"
              ? primaryLoadingText
              : isEdit
              ? "Publish / Update"
              : "Publish Now"}
          </button>
        </div>
      </div>
    </form>
  )
}