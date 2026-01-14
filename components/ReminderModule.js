"use client"

import { useEffect, useRef, useState } from "react"

const STORAGE_KEY = "pulseDailyReminders"

const DEFAULT_HYDRATION_MIN = 60
const DEFAULT_EYE_REST_MIN = 20
const DEFAULT_HYDRATION_BODY = "Time to drink water!"
const DEFAULT_EYE_REST_BODY = "Time to rest your eyes for 20 seconds."

function clampIntervalMinutes(value, fallback) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  const rounded = Math.round(parsed)
  if (rounded < 1) return 1
  if (rounded > 24 * 60) return 24 * 60
  return rounded
}

function minutesToMs(minutes) {
  return minutes * 60 * 1000
}

function getNow() {
  return Date.now()
}

function getDefaultState() {
  return {
    hydrationEnabled: false,
    eyeRestEnabled: false,
    hydrationNextAt: null,
    eyeRestNextAt: null,
    hydrationIntervalMin: DEFAULT_HYDRATION_MIN,
    eyeRestIntervalMin: DEFAULT_EYE_REST_MIN,
    hydrationBody: DEFAULT_HYDRATION_BODY,
    eyeRestBody: DEFAULT_EYE_REST_BODY
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
        typeof parsed?.eyeRestNextAt === "number" ? parsed.eyeRestNextAt : null,
      hydrationIntervalMin: clampIntervalMinutes(
        parsed?.hydrationIntervalMin,
        DEFAULT_HYDRATION_MIN
      ),
      eyeRestIntervalMin: clampIntervalMinutes(parsed?.eyeRestIntervalMin, DEFAULT_EYE_REST_MIN),
      hydrationBody:
        typeof parsed?.hydrationBody === "string" ? parsed.hydrationBody : DEFAULT_HYDRATION_BODY,
      eyeRestBody:
        typeof parsed?.eyeRestBody === "string" ? parsed.eyeRestBody : DEFAULT_EYE_REST_BODY
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

function Switch({ label, description, checked, onChange, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
        {children ? <div className="mt-3">{children}</div> : null}
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
  const [hydrationIntervalMin, setHydrationIntervalMin] = useState(DEFAULT_HYDRATION_MIN)
  const [eyeRestIntervalMin, setEyeRestIntervalMin] = useState(DEFAULT_EYE_REST_MIN)
  const [hydrationBody, setHydrationBody] = useState(DEFAULT_HYDRATION_BODY)
  const [eyeRestBody, setEyeRestBody] = useState(DEFAULT_EYE_REST_BODY)
  const [error, setError] = useState("")

  const stateRef = useRef(getDefaultState())
  const hydrationTimerRef = useRef(null)
  const eyeRestTimerRef = useRef(null)

  function persistRef(overrides) {
    const base = stateRef.current ?? getDefaultState()
    saveState({ ...base, ...overrides })
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

      const intervalMs = minutesToMs(
        clampIntervalMinutes(stateRef.current?.hydrationIntervalMin, DEFAULT_HYDRATION_MIN)
      )
      const body =
        typeof stateRef.current?.hydrationBody === "string" && stateRef.current.hydrationBody.trim()
          ? stateRef.current.hydrationBody
          : DEFAULT_HYDRATION_BODY

      showNotification({
        title: "Hydration Reminder",
        body
      })

      const scheduled = now + intervalMs
      setHydrationNextAt(scheduled)
      persistRef({ hydrationEnabled: true, hydrationNextAt: scheduled })
      nextAt = scheduled
    }, 30_000)
  }

  function startEyeRestTimer(nextAt) {
    clearEyeRestTimer()

    eyeRestTimerRef.current = setInterval(() => {
      const now = getNow()
      if (typeof nextAt !== "number") return
      if (now < nextAt) return

      const intervalMs = minutesToMs(
        clampIntervalMinutes(stateRef.current?.eyeRestIntervalMin, DEFAULT_EYE_REST_MIN)
      )
      const body =
        typeof stateRef.current?.eyeRestBody === "string" && stateRef.current.eyeRestBody.trim()
          ? stateRef.current.eyeRestBody
          : DEFAULT_EYE_REST_BODY

      showNotification({
        title: "Eye Rest",
        body
      })

      const scheduled = now + intervalMs
      setEyeRestNextAt(scheduled)
      persistRef({ eyeRestEnabled: true, eyeRestNextAt: scheduled })
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
    setHydrationIntervalMin(stored.hydrationIntervalMin)
    setEyeRestIntervalMin(stored.eyeRestIntervalMin)
    setHydrationBody(stored.hydrationBody)
    setEyeRestBody(stored.eyeRestBody)

    // Only resume timers if the browser already granted permission.
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      if (stored.hydrationEnabled) {
        const nextAt =
          typeof stored.hydrationNextAt === "number"
            ? stored.hydrationNextAt
            : getNow() + minutesToMs(stored.hydrationIntervalMin)
        setHydrationNextAt(nextAt)
        startHydrationTimer(nextAt)
      }
      if (stored.eyeRestEnabled) {
        const nextAt =
          typeof stored.eyeRestNextAt === "number"
            ? stored.eyeRestNextAt
            : getNow() + minutesToMs(stored.eyeRestIntervalMin)
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

  useEffect(() => {
    stateRef.current = {
      hydrationEnabled,
      eyeRestEnabled,
      hydrationNextAt,
      eyeRestNextAt,
      hydrationIntervalMin,
      eyeRestIntervalMin,
      hydrationBody,
      eyeRestBody
    }
  }, [
    hydrationEnabled,
    eyeRestEnabled,
    hydrationNextAt,
    eyeRestNextAt,
    hydrationIntervalMin,
    eyeRestIntervalMin,
    hydrationBody,
    eyeRestBody
  ])

  async function toggleHydration(nextEnabled) {
    setError("")

    if (nextEnabled) {
      const ok = await ensureNotificationPermission()
      if (!ok) {
        setError(
          "Notifications are blocked. Please allow notifications in your browser to enable reminders."
        )
        setHydrationEnabled(false)
        persistRef({ hydrationEnabled: false, hydrationNextAt: null })
        return
      }

      const intervalMs = minutesToMs(
        clampIntervalMinutes(stateRef.current?.hydrationIntervalMin, DEFAULT_HYDRATION_MIN)
      )
      const nextAt = getNow() + intervalMs
      setHydrationEnabled(true)
      setHydrationNextAt(nextAt)
      persistRef({ hydrationEnabled: true, hydrationNextAt: nextAt })
      startHydrationTimer(nextAt)
      return
    }

    // Turning off: stop timer and clear its schedule.
    setHydrationEnabled(false)
    setHydrationNextAt(null)
    persistRef({ hydrationEnabled: false, hydrationNextAt: null })
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
        persistRef({ eyeRestEnabled: false, eyeRestNextAt: null })
        return
      }

      const intervalMs = minutesToMs(
        clampIntervalMinutes(stateRef.current?.eyeRestIntervalMin, DEFAULT_EYE_REST_MIN)
      )
      const nextAt = getNow() + intervalMs
      setEyeRestEnabled(true)
      setEyeRestNextAt(nextAt)
      persistRef({ eyeRestEnabled: true, eyeRestNextAt: nextAt })
      startEyeRestTimer(nextAt)
      return
    }

    setEyeRestEnabled(false)
    setEyeRestNextAt(null)
    persistRef({ eyeRestEnabled: false, eyeRestNextAt: null })
    clearEyeRestTimer()
  }

  function onChangeHydrationInterval(value) {
    const nextMin = clampIntervalMinutes(value, hydrationIntervalMin)
    setHydrationIntervalMin(nextMin)
    persistRef({ hydrationIntervalMin: nextMin })

    if (!hydrationEnabled) return
    const nextAt = getNow() + minutesToMs(nextMin)
    setHydrationNextAt(nextAt)
    persistRef({ hydrationNextAt: nextAt })
    startHydrationTimer(nextAt)
  }

  function onChangeEyeRestInterval(value) {
    const nextMin = clampIntervalMinutes(value, eyeRestIntervalMin)
    setEyeRestIntervalMin(nextMin)
    persistRef({ eyeRestIntervalMin: nextMin })

    if (!eyeRestEnabled) return
    const nextAt = getNow() + minutesToMs(nextMin)
    setEyeRestNextAt(nextAt)
    persistRef({ eyeRestNextAt: nextAt })
    startEyeRestTimer(nextAt)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Reminders</h2>
      <p className="mt-1 text-xs text-slate-500">
        Enable gentle timers to nudge you throughout the day.
      </p>

      <div className="mt-4 space-y-4">
        <Switch
          label="Hydration Reminder"
          description="Get notified on a custom interval."
          checked={hydrationEnabled}
          onChange={toggleHydration}
        >
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Interval (minutes)</span>
              <input
                type="number"
                min={1}
                max={24 * 60}
                step={1}
                value={hydrationIntervalMin}
                onChange={(e) => onChangeHydrationInterval(e.target.value)}
                className="mt-1 w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Reminder text</span>
              <input
                type="text"
                value={hydrationBody}
                onChange={(e) => {
                  const next = e.target.value
                  setHydrationBody(next)
                  persistRef({ hydrationBody: next })
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder={DEFAULT_HYDRATION_BODY}
              />
            </label>
          </div>
        </Switch>
        <Switch
          label="Eye Rest"
          description="Get notified on a custom interval."
          checked={eyeRestEnabled}
          onChange={toggleEyeRest}
        >
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Interval (minutes)</span>
              <input
                type="number"
                min={1}
                max={24 * 60}
                step={1}
                value={eyeRestIntervalMin}
                onChange={(e) => onChangeEyeRestInterval(e.target.value)}
                className="mt-1 w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Reminder text</span>
              <input
                type="text"
                value={eyeRestBody}
                onChange={(e) => {
                  const next = e.target.value
                  setEyeRestBody(next)
                  persistRef({ eyeRestBody: next })
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder={DEFAULT_EYE_REST_BODY}
              />
            </label>
          </div>
        </Switch>
      </div>

      {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}

      <p className="mt-3 text-xs text-slate-400">
        Note: Browser notifications usually require HTTPS (or localhost).
      </p>
    </section>
  )
}
