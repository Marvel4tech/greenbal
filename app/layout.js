import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/Footer";

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
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "greenball360",
  },

  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  openGraph: {
    title: "greenball360 — Predict. Compete. Win Weekly.",
    description:
      "Join Greenball360, a London free sports prediction platform. Make your picks, climb the leaderboard, and win weekly rewards.",
    url: "https://www.greenball360.com",
    siteName: "greenball360",
    images: [
      {
        url: "/images/og-cover.jpg",
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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${space.variable}`}>
      <body className={`${inter.variable} ${space.variable} font-sans`}>
        <ThemeProvider>
          <main>
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
