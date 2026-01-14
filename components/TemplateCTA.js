"use client"

import { useMemo, useState } from "react"

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function getTodayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function buildPayload(habitNames) {
  const habits = habitNames
    .map((name) => (typeof name === "string" ? name.trim().slice(0, 20) : ""))
    .filter(Boolean)
    .map((name) => ({ id: makeId(), name }))

  const statusById = {}
  for (const h of habits) statusById[h.id] = 0

  return { date: getTodayKey(), habits, statusById }
}

export default function TemplateCTA({ habitNames, label = "Use this template" }) {
  const [error, setError] = useState("")

  const payload = useMemo(() => buildPayload(habitNames), [habitNames])

  function applyTemplate() {
    setError("")

    try {
      const existingRaw = localStorage.getItem("pulseDailyData")
      if (existingRaw) {
        const existing = JSON.parse(existingRaw)
        const existingHabits = Array.isArray(existing?.habits) ? existing.habits : []
        if (existingHabits.length > 0) {
          const ok = window.confirm(
            "This will replace your current habits in PulseDaily. Continue?"
          )
          if (!ok) return
        }
      }
    } catch {
      // Ignore parse errors and overwrite anyway.
    }

    try {
      localStorage.setItem("pulseDailyData", JSON.stringify(payload))
    } catch {
      setError("Could not save to local storage (blocked or full).")
      return
    }

    window.location.href = "/"
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={applyTemplate}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {label}
      </button>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      <p className="text-xs text-slate-500">
        Local-only: this writes to your browser storage (no account needed).
      </p>
    </div>
  )
}

