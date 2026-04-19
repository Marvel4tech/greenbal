import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/Footer";

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

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-35675X76YH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-35675X76YH');
          `}
        </Script>
      </body>
    </html>
  );
}