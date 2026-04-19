import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/Footer";
import { GoogleAnalytics } from "@next/third-parties/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata = {
  metadataBase: new URL("https://www.greenball360.com"),

  verification: {
    google: "4skqnihVCK-mohRYQLYR-77d7fJcamVoGhiVXd-zp0s", // paste your code here
  },

  title: {
    default: "Greenball360 — Free Sports Predictions & Weekly Rewards",
    template: "%s | Greenball360",
  },

  description:
    "Greenball360 is a free weekly sports prediction platform. Predict match outcomes, climb the leaderboard, and compete for weekly cash rewards.",

  keywords: [
    "free football predictions",
    "sports prediction game",
    "weekly leaderboard",
    "sports cash rewards",
    "Greenball360",
  ],

  applicationName: "Greenball360",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Greenball360",
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
    title: "Greenball360 — Free Sports Predictions & Weekly Rewards",
    description:
      "Join Greenball360, a free sports prediction platform. Make your picks, climb the leaderboard, and compete for weekly rewards.",
    url: "https://www.greenball360.com",
    siteName: "Greenball360",
    images: [
      {
        url: "/images/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: "Greenball360",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Greenball360 — Free Sports Predictions",
    description:
      "Predict match outcomes, climb the leaderboard, and compete weekly on Greenball360.",
    images: ["/images/og-cover.jpg"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${space.variable}`}
    >
      <body className={`${inter.variable} ${space.variable} font-sans`}>
        <ThemeProvider>
          <main>{children}</main>
          <Footer />
        </ThemeProvider>

        <GoogleAnalytics gaId="G-35675X76YH" />
      </body>
    </html>
  );
}