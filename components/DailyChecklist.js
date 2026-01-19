"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import ShareCardModal from "@/components/ShareCardModal"

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

function IconShare(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <path
        d="M15 8a3 3 0 1 0-2.83-4H12a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 13a3 3 0 1 0-2.83-4H4a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 20a3 3 0 1 0-2.83-4H14a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 11.5 14 8.5M8.6 12.5 14 15.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ConfettiBurst({ triggerKey, onDone }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !triggerKey) return

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (onDoneRef.current) onDoneRef.current()
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = 64
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const colors = ["#34d399", "#22c55e", "#f59e0b", "#60a5fa", "#f472b6"]
    const shards = Array.from({ length: 14 }).map(() => {
      const angle = Math.random() * Math.PI * 2
      return {
        x: 32,
        y: 32,
        vx: Math.cos(angle) * (1.5 + Math.random() * 2.2),
        vy: Math.sin(angle) * (1.5 + Math.random() * 2.2),
        size: 2 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      }
    })

    const start = performance.now()
    const duration = 650

    const tick = (now) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, size, size)

      shards.forEach((s) => {
        const t = Math.min(elapsed / duration, 1)
        s.x += s.vx
        s.y += s.vy
        s.vy += 0.02
        s.life = 1 - t
        ctx.globalAlpha = Math.max(s.life, 0)
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.ellipse(s.x, s.y, s.size, s.size * 0.6, t * 6, 0, Math.PI * 2)
        ctx.fill()
      })

      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, size, size)
        if (onDoneRef.current) onDoneRef.current()
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [triggerKey])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      aria-hidden="true"
    />
  )
}

function HabitStatusCheckbox({
  state,
  onToggle,
  label,
  pulseClass,
  confettiKey,
  onConfettiDone
}) {
  // State meanings:
  // 0 = empty (not started)
  // 1 = partial (yellow half-fill)
  // 2 = full (green with check)
  const isPartial = state === 1
  const isFull = state === 2

  const baseClasses =
    "relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-visible rounded-full border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"

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
      className={[baseClasses, stateClasses, pulseClass].filter(Boolean).join(" ")}
    >
      {/* Tailwind checkbox states:
          - Empty: white circle
          - Partial: amber circle with "half-fill" effect (white overlay on left half)
          - Full: green circle with a check icon */}
      {confettiKey ? (
        <ConfettiBurst triggerKey={confettiKey} onDone={onConfettiDone} />
      ) : null}

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
  streakById = {},
  lastCompleteDateById = {},
  todayBackupById = {}
}) {
  const [pulseById, setPulseById] = useState({})
  const [confettiById, setConfettiById] = useState({})
  const pulseTimersRef = useRef({})
  const confettiTimersRef = useRef({})
  const [shareHabitId, setShareHabitId] = useState(null)

  const setStatus =
    onSetStatus ??
    (() => {
      // Beginner note:
      // When DailyChecklist is used without a parent callback, it can't persist changes.
      // In PulseDaily we pass a real callback from app/page.js.
    })

  function triggerPulse(id, tone) {
    if (!tone) return
    setPulseById((prev) => ({ ...prev, [id]: tone }))

    const existing = pulseTimersRef.current[id]
    if (existing) clearTimeout(existing)

    pulseTimersRef.current[id] = setTimeout(() => {
      setPulseById((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      delete pulseTimersRef.current[id]
    }, tone === "pulse-full" ? 600 : 450)
  }

  function triggerConfetti(id) {
    const key = Date.now() + Math.random()
    setConfettiById((prev) => ({ ...prev, [id]: key }))

    const existing = confettiTimersRef.current[id]
    if (existing) clearTimeout(existing)

    confettiTimersRef.current[id] = setTimeout(() => {
      setConfettiById((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      delete confettiTimersRef.current[id]
    }, 800)
  }

  const totals = useMemo(() => {
    const total = habits.length
    const done = habits.reduce((sum, h) => {
      const s = statusById[h.id] ?? 0
      return sum + (s === 2 ? 1 : s === 1 ? 0.5 : 0)
    }, 0)
    return { done, total }
  }, [habits, statusById])

  const shareHabit = useMemo(
    () => (shareHabitId ? habits.find((h) => h.id === shareHabitId) : null),
    [shareHabitId, habits]
  )

  useEffect(() => {
    return () => {
      Object.values(pulseTimersRef.current).forEach((timer) => clearTimeout(timer))
      pulseTimersRef.current = {}
      Object.values(confettiTimersRef.current).forEach((timer) => clearTimeout(timer))
      confettiTimersRef.current = {}
    }
  }, [])

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
            const streakCount = Number(streakById[habit.id] ?? 0)
            const borderTone =
              state === 2
                ? "border-emerald-300"
                : state === 1
                  ? "border-amber-300"
                  : "border-rose-300"

            return (
              <li
                key={habit.id}
                className={[
                  "rounded-xl border bg-white px-3 py-2 shadow-sm",
                  borderTone
                ].join(" ")}
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
                        if (next === 1) triggerPulse(habit.id, "pulse-partial")
                        if (next === 2) {
                          triggerPulse(habit.id, "pulse-full")
                          triggerConfetti(habit.id)
                        }
                      }}
                      pulseClass={pulseById[habit.id]}
                      confettiKey={confettiById[habit.id]}
                      onConfettiDone={() =>
                        setConfettiById((prev) => {
                          const next = { ...prev }
                          delete next[habit.id]
                          return next
                        })
                      }
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {habit.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {stateLabel}
                        {streakCount > 0 ? ` | ${streakCount} day streak` : ""}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShareHabitId(habit.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                    aria-label={`Share ${habit.name}`}
                    title="Share"
                  >
                    <IconShare />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <ShareCardModal
        isOpen={Boolean(shareHabitId)}
        onClose={() => setShareHabitId(null)}
        habit={shareHabit}
        status={shareHabit ? statusById[shareHabit.id] ?? 0 : 0}
        streak={shareHabit ? streakById[shareHabit.id] ?? 0 : 0}
      />
    </section>
  )
}
