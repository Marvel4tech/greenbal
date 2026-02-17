"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FaFutbol } from "react-icons/fa"
import React, { useEffect, useRef, useState } from "react"
import { ThemeToggle } from "./theme-toggle"
import { Menu, X } from "lucide-react"

const Navbar = () => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const mobileMenuRef = useRef(null)

  const navlinks = [
    { href: "/", label: "Home" },
    { href: "/table", label: "Table" },
    { href: "/contact", label: "Contact Us" },
    { href: "/about", label: "About Us" },
  ]

  const isActive = (href) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  // Close menu on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close menu on outside click (mobile)
  useEffect(() => {
    if (!open) return

    const onPointerDown = (e) => {
      if (!mobileMenuRef.current) return
      if (!mobileMenuRef.current.contains(e.target)) setOpen(false)
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  // Close on ESC
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-lg">
      <div className="h-20 max-w-7xl mx-auto px-4 lg:px-0 flex justify-between items-center">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <FaFutbol className="text-3xl text-primary group-hover:rotate-12 transition" />
          <span className="font-light py-1 px-2 rounded-3xl border-1 border-primary text-white tracking-wide text-lg hidden sm:block">
            greenbal
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navlinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "px-4 py-2 rounded-lg transition-all duration-200",
                  active
                    ? "bg-primary text-black font-semibold"
                    : "text-white/80 font-medium hover:bg-primary hover:text-black",
                ].join(" ")}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          open ? "max-h-80" : "max-h-0"
        }`}
      >
        <div ref={mobileMenuRef} className="px-4 pb-4 bg-black/90 backdrop-blur">
          <nav className="flex flex-col gap-2">
            {navlinks.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "px-4 py-3 rounded-xl transition",
                    active
                      ? "bg-primary text-black font-semibold"
                      : "text-white font-medium hover:bg-primary hover:text-black",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Navbar

