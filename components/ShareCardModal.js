"use client"

import { useEffect, useMemo, useRef, useState } from "react"

function buildStatusMeta(status) {
  if (status === 2) {
    return {
      label: "Completed",
      accent: "emerald",
      message: "I did it today!"
    }
  }
  if (status === 1) {
    return {
      label: "Partial",
      accent: "amber",
      message: "Progress still counts."
    }
  }
  return {
    label: "Not started",
    accent: "rose",
    message: "Still time to start."
  }
}

const CONFETTI = [
  { top: "12%", left: "14%", size: 6, color: "bg-emerald-400" },
  { top: "18%", left: "78%", size: 5, color: "bg-amber-400" },
  { top: "30%", left: "88%", size: 4, color: "bg-sky-400" },
  { top: "42%", left: "6%", size: 5, color: "bg-pink-400" },
  { top: "64%", left: "90%", size: 6, color: "bg-emerald-300" },
  { top: "72%", left: "16%", size: 4, color: "bg-amber-300" },
  { top: "80%", left: "52%", size: 5, color: "bg-sky-300" }
]

export default function ShareCardModal({
  isOpen,
  onClose,
  habit,
  status,
  streak
}) {
  const cardRef = useRef(null)
  const [busy, setBusy] = useState("")
  const [hint, setHint] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")

  const meta = useMemo(() => buildStatusMeta(status), [status])
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://pulsedaily.codezs.online"
  const shareUrl = `${siteUrl}/?utm_source=share&utm_medium=card`
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
    []
  )

  const streakLabel =
    streak && Number(streak) > 0 ? `${Number(streak)}-day streak` : "New streak"

  const caption = `${habit?.name || "Habit"} • ${streakLabel} • ${meta.label} — ${
    meta.message
  } ${shareUrl}`

  useEffect(() => {
    let mounted = true
    async function makeQr() {
      try {
        const qrcode = (await import("qrcode")).default
        const url = await qrcode.toDataURL(shareUrl, {
          margin: 1,
          width: 120,
          color: { dark: "#0f172a", light: "#ffffff" }
        })
        if (mounted) setQrDataUrl(url)
      } catch {
        if (mounted) setQrDataUrl("")
      }
    }
    makeQr()
    return () => {
      mounted = false
    }
  }, [shareUrl])

  async function renderCanvas() {
    if (!cardRef.current) return null
    setBusy("Rendering...")
    try {
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      })
      return canvas
    } finally {
      setBusy("")
    }
  }

  async function handleCopyImage() {
    setHint("")
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
      setHint("Clipboard image copy is not supported in this browser.")
      return
    }

    const canvas = await renderCanvas()
    if (!canvas) return

    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        setHint("Image copied to clipboard.")
      } catch {
        setHint("Copy failed. Try download instead.")
      }
    }, "image/png")
  }

  async function handleDownload() {
    setHint("")
    const canvas = await renderCanvas()
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `pulsedaily_${habit?.name?.replace(/\s+/g, "_") || "habit"}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }, "image/png")
  }

  async function handleCopyText() {
    setHint("")
    if (!navigator.clipboard) {
      setHint("Clipboard text copy is not supported in this browser.")
      return
    }
    try {
      await navigator.clipboard.writeText(caption)
      setHint("Caption copied.")
    } catch {
      setHint("Copy failed.")
    }
  }

  if (!isOpen || !habit) return null

  const accentRing =
    meta.accent === "emerald"
      ? "ring-emerald-200"
      : meta.accent === "amber"
        ? "ring-amber-200"
        : "ring-rose-200"

  const accentBadge =
    meta.accent === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : meta.accent === "amber"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Share your streak</p>
            <p className="mt-1 text-xs text-slate-500">
              Preview and share a card for this habit.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <div
            ref={cardRef}
            className={[
              "relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/80 bg-white p-6",
              "shadow-lg ring-2",
              accentRing
            ].join(" ")}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-100" />
            {CONFETTI.map((dot, idx) => (
              <span
                key={`${dot.left}-${idx}`}
                className={[
                  "absolute rounded-full opacity-90",
                  dot.color
                ].join(" ")}
                style={{
                  top: dot.top,
                  left: dot.left,
                  width: `${dot.size}px`,
                  height: `${dot.size}px`
                }}
                aria-hidden="true"
              />
            ))}

            <div className="relative z-10">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="PulseDaily" className="h-6 w-6 rounded-md" />
                  <span className="font-semibold text-slate-700">PulseDaily</span>
                </div>
                <span>{dateLabel}</span>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Daily Habit
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  {habit.name}
                </h3>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <span className="text-3xl font-semibold text-slate-900">
                  {streak && Number(streak) > 0 ? Number(streak) : 0}
                </span>
                <div>
                  <p className="text-xs text-slate-500">Consecutive days</p>
                  <p className="text-sm font-medium text-slate-700">{streakLabel}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    accentBadge
                  ].join(" ")}
                >
                  {meta.label}
                </span>
                <span className="text-xs text-slate-500">{meta.message}</span>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200/70 pt-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Try PulseDaily
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-700">{siteUrl}</p>
                </div>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="PulseDaily QR code"
                    className="h-16 w-16 rounded-md border border-slate-200 bg-white p-1"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyImage}
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Copy image
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
          >
            Download PNG
          </button>
          <button
            type="button"
            onClick={handleCopyText}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
          >
            Copy caption
          </button>
          {busy ? <span className="text-xs text-slate-500">{busy}</span> : null}
        </div>

        {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
      </div>
    </div>
  )
}
