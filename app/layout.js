import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" })

export const metadata = {
  metadataBase: new URL("https://www.greenball360.com"),

  title: {
    default: "greenball360 — Predict. Compete. Win Weekly.",
    template: "%s | greenball360",
  },

  description:
    "greenball360 is a free weekly sports prediction platform based in South London. Predict match outcomes, climb the leaderboard, and compete for weekly cash rewards.",

  keywords: [
    "football predictions",
    "sports prediction game",
    "weekly leaderboard",
    "sports cash rewards",
    "greenball360",
  ],

  applicationName: "greenball360",

  openGraph: {
    title: "greenball360 — Predict. Compete. Win Weekly.",
    description:
      "Join Greenball360, a South London sports prediction platform. Make your picks, climb the leaderboard, and win weekly rewards.",
    url: "https://www.greenball360.com",
    siteName: "greenball360",
    images: [
      {
        url: "/images/og-cover.jpg", // 👉 add later
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "greenball360 — Weekly Sports Predictions",
    description:
      "Predict match outcomes, climb the leaderboard, and win weekly.",
    images: ["/images/og-cover.jpg"],
  },
}


export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${space.variable}`}>
      <body className={`${inter.variable} ${space.variable} font-sans`}>
        <ThemeProvider>
          {children} 
        </ThemeProvider>
      </body>
    </html>
  );
}
