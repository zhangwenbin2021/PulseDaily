"use client"

import { useEffect, useRef, useState } from "react"

const STORAGE_KEY = "pulseDailyReminders"

const HYDRATION_MS = 60 * 60 * 1000 // 60 minutes
const EYE_REST_MS = 20 * 60 * 1000 // 20 minutes

function getNow() {
  return Date.now()
}

function getDefaultState() {
  return {
    hydrationEnabled: false,
    eyeRestEnabled: false,
    hydrationNextAt: null,
    eyeRestNextAt: null
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultState()
    const parsed = JSON.parse(raw)
    return {
      hydrationEnabled: Boolean(parsed?.hydrationEnabled),
      eyeRestEnabled: Boolean(parsed?.eyeRestEnabled),
      hydrationNextAt:
        typeof parsed?.hydrationNextAt === "number" ? parsed.hydrationNextAt : null,
      eyeRestNextAt:
        typeof parsed?.eyeRestNextAt === "number" ? parsed.eyeRestNextAt : null
    }
  } catch {
    return getDefaultState()
  }
}

function saveState(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // If storage is blocked/full, the module still works for this session.
  }
}

function Switch({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-emerald-500 bg-emerald-500"
            : "border-slate-200 bg-slate-100"
        ].join(" ")}
        aria-pressed={checked}
      >
        <span
          className={[
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          ].join(" ")}
          aria-hidden="true"
        />
        <span className="sr-only">{label}</span>
      </button>
    </div>
  )
}

async function ensureNotificationPermission() {
  // Permission logic:
  // - "granted": we can show notifications
  // - "default": ask the user
  // - "denied": we must not spam prompts; user needs to enable via browser settings
  if (typeof Notification === "undefined") return false

  if (Notification.permission === "granted") return true
  if (Notification.permission === "denied") return false

  const result = await Notification.requestPermission()
  return result === "granted"
}

function showNotification({ title, body }) {
  // Notification handling:
  // Creating a Notification shows a system-level toast (requires HTTPS or localhost).
  // Clicking the notification should bring the user back to PulseDaily.
  try {
    const n = new Notification(title, { body })
    n.onclick = () => {
      // Attempt to focus the tab, then navigate to the app.
      window.focus()
      window.location.href = window.location.origin
    }
  } catch {
    // If notifications are blocked, do nothing.
  }
}

export default function ReminderModule() {
  const [hydrationEnabled, setHydrationEnabled] = useState(false)
  const [eyeRestEnabled, setEyeRestEnabled] = useState(false)
  const [hydrationNextAt, setHydrationNextAt] = useState(null)
  const [eyeRestNextAt, setEyeRestNextAt] = useState(null)
  const [error, setError] = useState("")

  const hydrationTimerRef = useRef(null)
  const eyeRestTimerRef = useRef(null)

  function persist(next) {
    saveState(next)
  }

  function clearHydrationTimer() {
    if (hydrationTimerRef.current) clearInterval(hydrationTimerRef.current)
    hydrationTimerRef.current = null
  }

  function clearEyeRestTimer() {
    if (eyeRestTimerRef.current) clearInterval(eyeRestTimerRef.current)
    eyeRestTimerRef.current = null
  }

  function startHydrationTimer(nextAt) {
    clearHydrationTimer()

    // Timer logic:
    // We use setInterval to periodically check whether it's time to notify.
    // This allows the timer to "resume" after reload using the stored nextAt timestamp.
    hydrationTimerRef.current = setInterval(() => {
      const now = getNow()
      if (typeof nextAt !== "number") return
      if (now < nextAt) return

      showNotification({
        title: "Hydration Reminder",
        body: "Time to drink water!"
      })

      const scheduled = now + HYDRATION_MS
      setHydrationNextAt(scheduled)
      persist({
        hydrationEnabled: true,
        eyeRestEnabled,
        hydrationNextAt: scheduled,
        eyeRestNextAt
      })
      nextAt = scheduled
    }, 30_000)
  }

  function startEyeRestTimer(nextAt) {
    clearEyeRestTimer()

    eyeRestTimerRef.current = setInterval(() => {
      const now = getNow()
      if (typeof nextAt !== "number") return
      if (now < nextAt) return

      showNotification({
        title: "Eye Rest",
        body: "Time to rest your eyes for 20 seconds."
      })

      const scheduled = now + EYE_REST_MS
      setEyeRestNextAt(scheduled)
      persist({
        hydrationEnabled,
        eyeRestEnabled: true,
        hydrationNextAt,
        eyeRestNextAt: scheduled
      })
      nextAt = scheduled
    }, 30_000)
  }

  useEffect(() => {
    // Load persisted toggle state on mount and resume timers.
    const stored = loadState()
    setHydrationEnabled(stored.hydrationEnabled)
    setEyeRestEnabled(stored.eyeRestEnabled)
    setHydrationNextAt(stored.hydrationNextAt)
    setEyeRestNextAt(stored.eyeRestNextAt)

    // Only resume timers if the browser already granted permission.
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      if (stored.hydrationEnabled) {
        const nextAt =
          typeof stored.hydrationNextAt === "number"
            ? stored.hydrationNextAt
            : getNow() + HYDRATION_MS
        setHydrationNextAt(nextAt)
        startHydrationTimer(nextAt)
      }
      if (stored.eyeRestEnabled) {
        const nextAt =
          typeof stored.eyeRestNextAt === "number"
            ? stored.eyeRestNextAt
            : getNow() + EYE_REST_MS
        setEyeRestNextAt(nextAt)
        startEyeRestTimer(nextAt)
      }
    }

    return () => {
      clearHydrationTimer()
      clearEyeRestTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleHydration(nextEnabled) {
    setError("")

    if (nextEnabled) {
      const ok = await ensureNotificationPermission()
      if (!ok) {
        setError(
          "Notifications are blocked. Please allow notifications in your browser to enable reminders."
        )
        setHydrationEnabled(false)
        persist({ hydrationEnabled: false, eyeRestEnabled, hydrationNextAt: null, eyeRestNextAt })
        return
      }

      const nextAt = getNow() + HYDRATION_MS
      setHydrationEnabled(true)
      setHydrationNextAt(nextAt)
      persist({
        hydrationEnabled: true,
        eyeRestEnabled,
        hydrationNextAt: nextAt,
        eyeRestNextAt
      })
      startHydrationTimer(nextAt)
      return
    }

    // Turning off: stop timer and clear its schedule.
    setHydrationEnabled(false)
    setHydrationNextAt(null)
    persist({
      hydrationEnabled: false,
      eyeRestEnabled,
      hydrationNextAt: null,
      eyeRestNextAt
    })
    clearHydrationTimer()
  }

  async function toggleEyeRest(nextEnabled) {
    setError("")

    if (nextEnabled) {
      const ok = await ensureNotificationPermission()
      if (!ok) {
        setError(
          "Notifications are blocked. Please allow notifications in your browser to enable reminders."
        )
        setEyeRestEnabled(false)
        persist({ hydrationEnabled, eyeRestEnabled: false, hydrationNextAt, eyeRestNextAt: null })
        return
      }

      const nextAt = getNow() + EYE_REST_MS
      setEyeRestEnabled(true)
      setEyeRestNextAt(nextAt)
      persist({
        hydrationEnabled,
        eyeRestEnabled: true,
        hydrationNextAt,
        eyeRestNextAt: nextAt
      })
      startEyeRestTimer(nextAt)
      return
    }

    setEyeRestEnabled(false)
    setEyeRestNextAt(null)
    persist({
      hydrationEnabled,
      eyeRestEnabled: false,
      hydrationNextAt,
      eyeRestNextAt: null
    })
    clearEyeRestTimer()
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Reminders</h2>
      <p className="mt-1 text-xs text-slate-500">
        Enable gentle timers to nudge you throughout the day.
      </p>

      <div className="mt-4 space-y-4">
        <Switch
          label="Hydration Reminder (60min)"
          description="Get notified every 60 minutes."
          checked={hydrationEnabled}
          onChange={toggleHydration}
        />
        <Switch
          label="Eye Rest (20min)"
          description="Get notified every 20 minutes."
          checked={eyeRestEnabled}
          onChange={toggleEyeRest}
        />
      </div>

      {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}

      <p className="mt-3 text-xs text-slate-400">
        Note: Browser notifications usually require HTTPS (or localhost).
      </p>
    </section>
  )
}

