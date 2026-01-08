import "./globals.css"
import { Inter } from "next/font/google"
import Image from "next/image"

import ExportButton from "@/components/ExportButton"

// Load the Inter font from Google using Next.js built-in optimization.
// "display: swap" helps avoid invisible text on slow connections.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
})

export const metadata = {
  title: "PulseDaily",
  description: "A mobile-first habit tracker built with Next.js + Tailwind.",
  // Browser tab icon (favicon). Using /public/logo.png and also app/icon.png as fallback.
  icons: {
    icon: "/logo.png",
    apple: "/logo.png"
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} min-h-full bg-slate-50 text-slate-900 antialiased`}
      >
        {/* App shell: header + main + footer. */}
        <div className="min-h-screen">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto w-full max-w-md px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {/* Logo lives in /public, so reference it as "/logo.png". */}
                  <Image
                    src="/logo.png"
                    alt="PulseDaily logo"
                    width={28}
                    height={28}
                    priority
                    className="rounded-md"
                  />

                  <div>
                    <h1 className="text-lg font-semibold tracking-tight">
                      PulseDaily
                    </h1>
                    <p className="text-xs text-slate-500">
                      Build habits. Keep momentum.
                    </p>
                  </div>
                </div>

                {/* Top-right "Backup" button (client-side JSON export). */}
                <ExportButton />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-md px-4 py-6">{children}</main>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto w-full max-w-md px-4 py-4">
              <p className="text-xs text-slate-400">
                PulseDaily — stay consistent, not perfect.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
