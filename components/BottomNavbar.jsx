"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Trophy, Gamepad2, Home, Wallet2 } from "lucide-react"

const BottomNavbar = () => {
  const pathname = usePathname()

  const siderlinks = [
    { label: "Home", href: "/profile", icon: Home },
    { label: "Leaderboard", href: "/profile/leaderboard", icon: Trophy },
    { label: "Predict", href: "/profile/play", icon: Gamepad2 },
    { label: "Wallet", href: "/profile/wallet", icon: Wallet2 },
  ]

  const isActive = (href) => {
    if (href === "/profile") return pathname === "/profile"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-3 pb-4">

        <div className="relative">

          {/* 🔥 MUCH STRONGER GREEN GLOW */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-6 w-[90%] h-28 rounded-full bg-green-500/40 blur-[50px]" />

          {/* 🧱 SOLID NAVBAR */}
          <div className="relative rounded-full bg-white border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.15)]
                          dark:bg-black dark:border-white/10 dark:shadow-[0_14px_40px_rgba(0,0,0,0.8)]">

            <div className="grid grid-cols-4 items-center px-2 py-2">

              {siderlinks.map(({ label, href, icon: Icon }) => {
                const active = isActive(href)

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex flex-col items-center justify-center gap-1 rounded-full py-2 transition-all duration-200
                      ${active ? "text-primary" : "text-gray-600 dark:text-gray-300"}
                    `}
                  >

                    {/* ICON */}
                    <div
                      className={`flex items-center justify-center rounded-full px-3 py-2 transition-all duration-200
                        ${
                          active
                            ? "bg-primary text-black shadow-[0_6px_20px_rgba(34,197,94,0.5)] scale-105"
                            : "bg-transparent"
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* LABEL */}
                    <span className={`text-[11px] font-semibold ${active ? "text-primary" : ""}`}>
                      {label}
                    </span>

                  </Link>
                )
              })}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default BottomNavbar