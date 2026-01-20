"use client"

import { useEffect, useRef, useState } from "react"

const STORAGE_KEY = "pulseDailyReminders"
const STORAGE_VERSION = 2
const MAX_REMINDERS = 20

const DEFAULT_HYDRATION_MIN = 60
const DEFAULT_EYE_REST_MIN = 20
const DEFAULT_HYDRATION_TITLE = "Hydration Reminder"
const DEFAULT_EYE_REST_TITLE = "Eye Rest"
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

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function getDefaultItems() {
  return [
    {
      id: "preset_hydration",
      enabled: false,
      intervalMin: DEFAULT_HYDRATION_MIN,
      title: DEFAULT_HYDRATION_TITLE,
      body: DEFAULT_HYDRATION_BODY,
      nextAt: null
    },
    {
      id: "preset_eye_rest",
      enabled: false,
      intervalMin: DEFAULT_EYE_REST_MIN,
      title: DEFAULT_EYE_REST_TITLE,
      body: DEFAULT_EYE_REST_BODY,
      nextAt: null
    }
  ]
}

function sanitizeText(value, fallback, maxLen) {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return trimmed.slice(0, maxLen)
}

function sanitizeItem(item, fallbackId) {
  const safe = item && typeof item === "object" ? item : {}
  const id = typeof safe.id === "string" && safe.id ? safe.id : fallbackId
  const enabled = Boolean(safe.enabled)
  const intervalMin = clampIntervalMinutes(safe.intervalMin, 60)
  const title = sanitizeText(safe.title, "Reminder", 60)
  const body = typeof safe.body === "string" ? safe.body.trim().slice(0, 160) : ""
  const nextAt = typeof safe.nextAt === "number" ? safe.nextAt : null
  return { id, enabled, intervalMin, title, body, nextAt }
}

function normalizeState(parsed) {
  const items = Array.isArray(parsed?.items) ? parsed.items : null
  if (!items) {
    return { version: STORAGE_VERSION, items: getDefaultItems() }
  }
  const normalized = items
    .slice(0, MAX_REMINDERS)
    .map((it, idx) => sanitizeItem(it, `r_${idx}`))
  return { version: STORAGE_VERSION, items: normalized }
}

function migrateLegacyState(parsed) {
  const hydrationEnabled = Boolean(parsed?.hydrationEnabled)
  const eyeRestEnabled = Boolean(parsed?.eyeRestEnabled)

  const hydrationIntervalMin = clampIntervalMinutes(
    parsed?.hydrationIntervalMin,
    DEFAULT_HYDRATION_MIN
  )
  const eyeRestIntervalMin = clampIntervalMinutes(parsed?.eyeRestIntervalMin, DEFAULT_EYE_REST_MIN)

  const hydrationBody =
    typeof parsed?.hydrationBody === "string" ? parsed.hydrationBody : DEFAULT_HYDRATION_BODY
  const eyeRestBody =
    typeof parsed?.eyeRestBody === "string" ? parsed.eyeRestBody : DEFAULT_EYE_REST_BODY

  const hydrationNextAt =
    typeof parsed?.hydrationNextAt === "number"
      ? parsed.hydrationNextAt
      : hydrationEnabled
        ? getNow() + minutesToMs(hydrationIntervalMin)
        : null

  const eyeRestNextAt =
    typeof parsed?.eyeRestNextAt === "number"
      ? parsed.eyeRestNextAt
      : eyeRestEnabled
        ? getNow() + minutesToMs(eyeRestIntervalMin)
        : null

  return {
    version: STORAGE_VERSION,
    items: [
      {
        id: "preset_hydration",
        enabled: hydrationEnabled,
        intervalMin: hydrationIntervalMin,
        title: DEFAULT_HYDRATION_TITLE,
        body: sanitizeText(hydrationBody, DEFAULT_HYDRATION_BODY, 160),
        nextAt: hydrationNextAt
      },
      {
        id: "preset_eye_rest",
        enabled: eyeRestEnabled,
        intervalMin: eyeRestIntervalMin,
        title: DEFAULT_EYE_REST_TITLE,
        body: sanitizeText(eyeRestBody, DEFAULT_EYE_REST_BODY, 160),
        nextAt: eyeRestNextAt
      }
    ]
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: STORAGE_VERSION, items: getDefaultItems() }
    const parsed = JSON.parse(raw)

    if (parsed?.version === STORAGE_VERSION || Array.isArray(parsed?.items)) {
      return normalizeState(parsed)
    }

    if (
      typeof parsed?.hydrationEnabled !== "undefined" ||
      typeof parsed?.eyeRestEnabled !== "undefined"
    ) {
      return migrateLegacyState(parsed)
    }

    return { version: STORAGE_VERSION, items: getDefaultItems() }
  } catch {
    return { version: STORAGE_VERSION, items: getDefaultItems() }
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
        {label ? <p className="text-sm font-medium text-slate-900">{label}</p> : null}
        {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-emerald-500 bg-emerald-500" : "border-slate-200 bg-slate-100"
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
        <span className="sr-only">{label || "Toggle"}</span>
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
      window.focus()
      window.location.href = window.location.origin
    }
  } catch {
    // If notifications are blocked, do nothing.
  }
}

function formatNextIn(nextAt) {
  if (typeof nextAt !== "number") return ""
  const diffMs = nextAt - getNow()
  if (diffMs <= 0) return "now"
  const mins = Math.ceil(diffMs / 60_000)
  if (mins <= 1) return "in ~1 min"
  return `in ~${mins} min`
}

export default function ReminderModule({
  items: itemsProp,
  onItemsChange,
  storageEnabled = true
}) {
  const [items, setItems] = useState([])
  const [error, setError] = useState("")
  const [soundReady, setSoundReady] = useState(false)
  const [soundBlocked, setSoundBlocked] = useState(false)

  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draftTitle, setDraftTitle] = useState("")
  const [draftBody, setDraftBody] = useState("")
  const [draftIntervalMin, setDraftIntervalMin] = useState(60)

  const stateRef = useRef({ items: [] })
  const timerRef = useRef(null)
  const audioRef = useRef(null)

  function persistItems(nextItems) {
    if (onItemsChange) onItemsChange(nextItems)
    if (storageEnabled) {
      saveState({ version: STORAGE_VERSION, items: nextItems })
    }
  }

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  async function initAudioFromGesture() {
    if (typeof window === "undefined") return false
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) return false

    try {
      if (!audioRef.current) audioRef.current = new AudioContextCtor()
      if (audioRef.current.state === "suspended") {
        await audioRef.current.resume()
      }
      setSoundReady(true)
      setSoundBlocked(false)
      return true
    } catch {
      setSoundBlocked(true)
      return false
    }
  }

  async function playBeep() {
    try {
      const ctx = audioRef.current
      if (!ctx) {
        if (!soundBlocked) setSoundBlocked(true)
        return false
      }

      if (ctx.state === "suspended") {
        await ctx.resume()
      }

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = 880
      gain.gain.value = 0.0001
      osc.connect(gain)
      gain.connect(ctx.destination)

      const now = ctx.currentTime
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
      osc.start(now)
      osc.stop(now + 0.14)

      setSoundReady(true)
      return true
    } catch {
      if (!soundBlocked) setSoundBlocked(true)
      return false
    }
  }

  useEffect(() => {
    if (Array.isArray(itemsProp)) return

    if (!storageEnabled) {
      setItems(getDefaultItems())
      return
    }

    const stored = loadState()
    setItems(stored.items)
    persistItems(stored.items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const current = stateRef.current?.items ?? []
      if (!Array.isArray(current) || current.length === 0) return

      if (typeof Notification !== "undefined" && Notification.permission !== "granted") return

      const now = getNow()
      let changed = false

      const nextItems = current.map((it) => {
        if (!it.enabled) return it

        const intervalMin = clampIntervalMinutes(it.intervalMin, 60)
        const intervalMs = minutesToMs(intervalMin)
        const nextAt = typeof it.nextAt === "number" ? it.nextAt : now + intervalMs

        if (now < nextAt) {
          if (nextAt !== it.nextAt || intervalMin !== it.intervalMin) {
            changed = true
            return { ...it, intervalMin, nextAt }
          }
          return it
        }

        const title = sanitizeText(it.title, "Reminder", 60)
        const body = typeof it.body === "string" ? it.body : ""
        showNotification({ title, body })
        playBeep()

        changed = true
        return { ...it, intervalMin, title, body, nextAt: now + intervalMs }
      })

      if (changed) {
        setItems(nextItems)
        persistItems(nextItems)
      }
    }, 10_000)

    return () => clearTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!Array.isArray(itemsProp)) return
    setItems(itemsProp)
  }, [itemsProp])

  useEffect(() => {
    stateRef.current = { items }
  }, [items])

  function openCreate() {
    setError("")
    setEditingId(null)
    setDraftTitle("")
    setDraftBody("")
    setDraftIntervalMin(60)
    setIsEditorOpen(true)
  }

  function openEdit(item) {
    setError("")
    setEditingId(item.id)
    setDraftTitle(item.title)
    setDraftBody(item.body ?? "")
    setDraftIntervalMin(item.intervalMin)
    setIsEditorOpen(true)
  }

  function closeEditor() {
    setIsEditorOpen(false)
    setEditingId(null)
  }

  function upsertDraft() {
    setError("")
    const title = sanitizeText(draftTitle, "", 60)
    const body = typeof draftBody === "string" ? draftBody.trim().slice(0, 160) : ""
    const intervalMin = clampIntervalMinutes(draftIntervalMin, 60)

    if (!title) {
      setError("Please enter a title.")
      return
    }

    const now = getNow()
    const next = items.slice()

    if (editingId) {
      const idx = next.findIndex((x) => x.id === editingId)
      if (idx === -1) return
      const existing = next[idx]
      const nextAt = existing.enabled ? now + minutesToMs(intervalMin) : existing.nextAt
      next[idx] = { ...existing, title, body, intervalMin, nextAt }
      setItems(next)
      persistItems(next)
      closeEditor()
      return
    }

    if (next.length >= MAX_REMINDERS) {
      setError(`You can create up to ${MAX_REMINDERS} reminders.`)
      return
    }

    next.unshift(
      sanitizeItem(
        {
          id: makeId(),
          enabled: false,
          intervalMin,
          title,
          body,
          nextAt: null
        },
        makeId()
      )
    )

    setItems(next)
    persistItems(next)
    closeEditor()
  }

  function deleteItem(id) {
    setError("")
    const next = items.filter((x) => x.id !== id)
    setItems(next)
    persistItems(next)
  }

  async function toggleItem(id, nextEnabled) {
    setError("")
    await initAudioFromGesture()

    if (nextEnabled) {
      const ok = await ensureNotificationPermission()
      if (!ok) {
        setError(
          "Notifications are blocked. Please allow notifications in your browser to enable reminders."
        )
        return
      }
    }

    const now = getNow()
    const next = items.map((it) => {
      if (it.id !== id) return it
      if (!nextEnabled) return { ...it, enabled: false, nextAt: null }
      const intervalMin = clampIntervalMinutes(it.intervalMin, 60)
      return { ...it, enabled: true, intervalMin, nextAt: now + minutesToMs(intervalMin) }
    })
    setItems(next)
    persistItems(next)
  }

  async function testNow(item) {
    setError("")
    await initAudioFromGesture()

    const ok = await ensureNotificationPermission()
    if (!ok) {
      setError(
        "Notifications are blocked. Please allow notifications in your browser to test reminders."
      )
      return
    }

    showNotification({
      title: sanitizeText(item.title, "Reminder", 60),
      body: typeof item.body === "string" ? item.body : ""
    })
    playBeep()
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Reminders</h2>
          <p className="mt-1 text-xs text-slate-500">
            Create custom interval reminders (max {MAX_REMINDERS}).
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={items.length >= MAX_REMINDERS}
          className={[
            "rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition",
            items.length >= MAX_REMINDERS
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : "bg-slate-900 text-white hover:bg-slate-800"
          ].join(" ")}
        >
          Add reminder
        </button>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Notifications require HTTPS (or localhost). Sound may require a click to enable.
      </p>

      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No reminders yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const nextLabel = item.enabled ? formatNextIn(item.nextAt) : ""
              return (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Every {item.intervalMin} min
                        {nextLabel ? ` • Next ${nextLabel}` : ""}
                      </p>
                      {item.body ? <p className="mt-2 text-xs text-slate-700">{item.body}</p> : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => testNow(item)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50"
                        >
                          Test now
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Switch
                        label=""
                        description=""
                        checked={item.enabled}
                        onChange={(nextEnabled) => toggleItem(item.id, nextEnabled)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {error ? <p className="mt-3 text-xs text-rose-600">{error}</p> : null}

      {!soundReady ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-600">Sound is not enabled yet. Click to enable.</p>
          <button
            type="button"
            onClick={async () => {
              await initAudioFromGesture()
              await playBeep()
            }}
            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Enable sound
          </button>
        </div>
      ) : null}

      {soundBlocked ? (
        <p className="mt-2 text-xs text-amber-700">
          Sound may be blocked by your browser. Use “Enable sound” or click “Test now” to allow it.
        </p>
      ) : null}

      <p className="mt-3 text-xs text-slate-400">Tip: Keep this tab open to receive reminders.</p>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {editingId ? "Edit reminder" : "New reminder"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Fixed-interval loop reminders.</p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Interval (minutes)</span>
                <input
                  type="number"
                  min={1}
                  max={24 * 60}
                  step={1}
                  value={draftIntervalMin}
                  onChange={(e) => setDraftIntervalMin(e.target.value)}
                  className="mt-1 w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-700">Title</span>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="e.g. Stretch break"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-700">Content</span>
                <input
                  type="text"
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Optional"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={upsertDraft}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
