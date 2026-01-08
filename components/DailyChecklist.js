"use client"

import { useEffect, useMemo } from "react"

function IconCheck(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HabitStatusCheckbox({ state, onToggle, label }) {
  // State meanings:
  // 0 = empty (not started)
  // 1 = partial (yellow half-fill)
  // 2 = full (green with check)
  const isPartial = state === 1
  const isFull = state === 2

  const baseClasses =
    "relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"

  const stateClasses = isFull
    ? "border-emerald-300 bg-emerald-500 text-white"
    : isPartial
      ? "border-amber-300 bg-amber-400 text-amber-900"
      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={[baseClasses, stateClasses].join(" ")}
    >
      {/* Tailwind checkbox states:
          - Empty: white circle
          - Partial: amber circle with "half-fill" effect (white overlay on left half)
          - Full: green circle with a check icon */}
      {isPartial ? (
        <span
          className="absolute inset-0 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          <span className="absolute inset-y-0 left-0 w-1/2 bg-white" />
        </span>
      ) : null}

      {isFull ? <IconCheck className="h-4 w-4 text-white" /> : null}
    </button>
  )
}

// DailyChecklist:
// A "Daily Checkbox Array" that supports partial + full completion.
// This reduces perfectionism anxiety by allowing "some progress" to count.
export default function DailyChecklist({
  habits = [],
  statusById = {},
  onSetStatus,
  hasHydrated = false
}) {
  const setStatus =
    onSetStatus ??
    (() => {
      // Beginner note:
      // When DailyChecklist is used without a parent callback, it can't persist changes.
      // In PulseDaily we pass a real callback from app/page.js.
    })

  const totals = useMemo(() => {
    const total = habits.length
    const done = habits.reduce((sum, h) => {
      const s = statusById[h.id] ?? 0
      return sum + (s === 2 ? 1 : s === 1 ? 0.5 : 0)
    }, 0)
    return { done, total }
  }, [habits, statusById])

  useEffect(() => {
    // LocalStorage write:
    // Save habit list + completion states whenever they change.
    // Guarded by `hasHydrated` so we don't overwrite existing storage before the initial load finishes.
    if (!hasHydrated) return

    const today = (() => {
      const d = new Date()
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${y}-${m}-${day}`
    })()

    // Keep the stored status object aligned with the habit list (no orphan keys).
    const nextStatusById = {}
    for (const h of habits) {
      const s = Number(statusById[h.id] ?? 0)
      nextStatusById[h.id] = s === 1 || s === 2 ? s : 0
    }

    const payload = {
      date: today,
      habits,
      statusById: nextStatusById
    }

    try {
      localStorage.setItem("pulseDailyData", JSON.stringify(payload))
    } catch {
      // If storage is full/blocked, we silently skip (app still works in-memory).
    }
  }, [habits, statusById, hasHydrated])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Daily Checkbox Array
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Tap once for partial, twice for full, third time to reset.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-semibold text-slate-900">Today</p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {totals.done}/{totals.total} habits
          </p>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4">
          <p className="text-xs text-slate-500">
            Add a habit first — your checklist will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {habits.map((habit) => {
            const state = statusById[habit.id] ?? 0
            const stateLabel =
              state === 2 ? "Full complete" : state === 1 ? "Partial complete" : "Not started"

            return (
              <li
                key={habit.id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {/* Custom circular checkbox (24px) with 3-state toggle:
                        1st tap: empty -> partial
                        2nd tap: partial -> full
                        3rd tap: full -> empty */}
                    <HabitStatusCheckbox
                      state={state}
                      label={`${habit.name}: ${stateLabel}`}
                      onToggle={() => {
                        // Click event logic:
                        // 0 -> 1 -> 2 -> 0 (cycles through empty/partial/full)
                        const next = state === 0 ? 1 : state === 1 ? 2 : 0
                        setStatus(habit.id, next)
                      }}
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {habit.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{stateLabel}</p>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
