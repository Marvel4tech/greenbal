"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Pilcrow,
  ImagePlus,
  Link as LinkIcon,
  Unlink,
  Newspaper,
  Search,
  X,
} from "lucide-react"

function getFileExt(filename = "") {
  return filename.includes(".") ? filename.split(".").pop().toLowerCase() : ""
}

function slugify(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export default function TiptapEditor({
  value,
  onChange,
  articleSlug = "news-article",
}) {
  const supabase = createClient()
  const fileInputRef = useRef(null)

  const [uploading, setUploading] = useState(false)

  const [showArticlePicker, setShowArticlePicker] = useState(false)
  const [articleSearch, setArticleSearch] = useState("")
  const [articles, setArticles] = useState([])
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [articleError, setArticleError] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: "mb-4 leading-relaxed",
          },
        },
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: "font-bold mt-6 mb-4",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-6 mb-4",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-6 mb-4",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "mb-1",
          },
        },
        hardBreak: {
          keepMarks: true,
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "rounded-xl my-6 w-full object-cover",
        },
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value || "<p>Start writing...</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] rounded-b-xl border-x border-b border-gray-300 bg-white px-4 py-4 outline-none dark:border-white/10 dark:bg-black/40",
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML()
      onChange(html)
    },
  })

  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p>Start writing...</p>", false)
    }
  }, [value, editor])

  const fetchArticles = async (searchTerm = "") => {
    try {
      setLoadingArticles(true)
      setArticleError("")

      let query = supabase
        .from("news_posts")
        .select("id, title, slug, status, published_at")
        .order("published_at", { ascending: false })
        .limit(20)

      if (searchTerm.trim()) {
        query = query.ilike("title", `%${searchTerm.trim()}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setArticles(data || [])
    } catch (err) {
      setArticleError(err.message || "Failed to load articles.")
      setArticles([])
    } finally {
      setLoadingArticles(false)
    }
  }

  const openArticlePicker = async () => {
    setShowArticlePicker(true)
    await fetchArticles(articleSearch)
  }

  const insertInternalLink = (article) => {
    if (!editor) return

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: `/news/${article.slug}` })
      .run()

    setShowArticlePicker(false)
  }

  const uploadInlineImage = async (file) => {
    if (!file) return

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

    if (!allowed.includes(file.type)) {
      alert("Only JPG, PNG, and WEBP files are allowed.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB.")
      return
    }

    try {
      setUploading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("You must be logged in.")
        return
      }

      const ext = getFileExt(file.name) || "jpg"
      const filePath = `inline/${user.id}/${slugify(articleSlug)}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("news-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from("news-images")
        .getPublicUrl(filePath)

      const publicUrl = data?.publicUrl

      if (publicUrl && editor) {
        editor.chain().focus().setImage({ src: publicUrl, alt: file.name }).run()
      }
    } catch (err) {
      alert(err.message || "Failed to upload image.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const setExternalLink = () => {
    if (!editor) return

    const previousUrl = editor.getAttributes("link").href || ""
    const url = window.prompt("Enter URL", previousUrl)

    if (url === null) return

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    const finalUrl =
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/") ||
      url.startsWith("#")
        ? url
        : `https://${url}`

    editor.chain().focus().extendMarkRange("link").setLink({ href: finalUrl }).run()
  }

  const unsetLink = () => {
    if (!editor) return
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
  }

  if (!editor) return null

  const btn =
    "inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-black/40 dark:text-white/80 dark:hover:bg-white/10"

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => uploadInlineImage(e.target.files?.[0] || null)}
      />

      <div className="flex flex-wrap gap-2 rounded-t-xl border border-gray-300 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
          Bold
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
          Italic
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
          Bullet List
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
          Numbered List
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
          H2
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
          H3
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Pilcrow className="h-4 w-4" />
          Paragraph
        </button>

        <button type="button" className={btn} onClick={setExternalLink}>
          <LinkIcon className="h-4 w-4" />
          External Link
        </button>

        <button type="button" className={btn} onClick={openArticlePicker}>
          <Newspaper className="h-4 w-4" />
          Internal Link
        </button>

        <button type="button" className={btn} onClick={unsetLink}>
          <Unlink className="h-4 w-4" />
          Remove Link
        </button>

        <button
          type="button"
          className={btn}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <ImagePlus className="h-4 w-4" />
          {uploading ? "Uploading..." : "Add Image"}
        </button>
      </div>

      <EditorContent editor={editor} />

      {showArticlePicker && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-black/90">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Link an Existing Article
            </h3>

            <button
              type="button"
              onClick={() => setShowArticlePicker(false)}
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-black/40 dark:text-white/80 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                placeholder="Search articles by title..."
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 outline-none focus:border-primary dark:border-white/10 dark:bg-black/40"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchArticles(articleSearch)}
              className="rounded-xl bg-primary px-4 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Search
            </button>
          </div>

          {loadingArticles ? (
            <p className="text-sm text-gray-500 dark:text-white/50">Loading articles...</p>
          ) : articleError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{articleError}</p>
          ) : articles.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-white/50">No articles found.</p>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {articles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => insertInternalLink(article)}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:border-primary hover:bg-primary/5 dark:border-white/10 dark:bg-white/5 dark:hover:border-primary"
                >
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {article.title}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-white/50">
                    /news/{article.slug}
                  </div>
                  <div className="mt-2 inline-flex rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 dark:bg-white/10 dark:text-white/70">
                    {article.status || "Post"}
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500 dark:text-white/50">
            Highlight text in the editor first, then choose an article to turn that text into an internal link.
          </p>
        </div>
      )}
    </div>
  )
}