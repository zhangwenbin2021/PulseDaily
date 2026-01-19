const HABIT_STORAGE_KEY = "pulseDailyData"
const REMINDER_STORAGE_KEY = "pulseDailyReminders"
const REMINDER_STORAGE_VERSION = 2
const MAX_REMINDERS = 20

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function normalizeHabitPayload(raw) {
  const habits = Array.isArray(raw?.habits)
    ? raw.habits
        .map((h) => ({
          id: typeof h?.id === "string" ? h.id : makeId(),
          name: typeof h?.name === "string" ? h.name.slice(0, 20) : ""
        }))
        .filter((h) => h.name.trim().length > 0)
    : []

  const statusById =
    raw?.statusById && typeof raw.statusById === "object" ? raw.statusById : {}
  const streakById =
    raw?.streakById && typeof raw.streakById === "object" ? raw.streakById : {}
  const lastCompleteDateById =
    raw?.lastCompleteDateById && typeof raw.lastCompleteDateById === "object"
      ? raw.lastCompleteDateById
      : {}
  const todayBackupById =
    raw?.todayBackupById && typeof raw.todayBackupById === "object"
      ? raw.todayBackupById
      : {}

  const nextStatusById = {}
  const nextStreakById = {}
  const nextLastCompleteDateById = {}
  const nextTodayBackupById = {}

  for (const h of habits) {
    const s = Number(statusById[h.id] ?? 0)
    nextStatusById[h.id] = s === 1 || s === 2 ? s : 0
    const streak = Number(streakById[h.id] ?? 0)
    nextStreakById[h.id] = Number.isFinite(streak) && streak > 0 ? streak : 0
    nextLastCompleteDateById[h.id] =
      typeof lastCompleteDateById[h.id] === "string" ? lastCompleteDateById[h.id] : ""
    const backup = todayBackupById[h.id]
    if (backup && typeof backup === "object") {
      const prevDate = typeof backup.prevDate === "string" ? backup.prevDate : ""
      const prevStreak = Number(backup.prevStreak ?? 0)
      nextTodayBackupById[h.id] = {
        prevDate,
        prevStreak: Number.isFinite(prevStreak) && prevStreak > 0 ? prevStreak : 0
      }
    }
  }

  return {
    date: typeof raw?.date === "string" ? raw.date : "",
    habits,
    statusById: nextStatusById,
    streakById: nextStreakById,
    lastCompleteDateById: nextLastCompleteDateById,
    todayBackupById: nextTodayBackupById
  }
}

function createSeedHabits() {
  return [
    { id: makeId(), name: "Drink Water" },
    { id: makeId(), name: "Read 1 Page" }
  ]
}

function hydrateHabitPayload(raw, { seedIfEmpty = true } = {}) {
  const normalized = normalizeHabitPayload(raw)
  const today = getLocalDateKey()
  const shouldReset = normalized.date !== today

  const baseHabits = normalized.habits.length === 0 && seedIfEmpty
    ? createSeedHabits()
    : normalized.habits

  const statusById = {}
  const streakById = {}
  const lastCompleteDateById = {}
  const todayBackupById = {}

  for (const h of baseHabits) {
    statusById[h.id] = shouldReset ? 0 : (normalized.statusById[h.id] ?? 0)
    streakById[h.id] = normalized.streakById[h.id] ?? 0
    lastCompleteDateById[h.id] = normalized.lastCompleteDateById[h.id] ?? ""
    if (!shouldReset && normalized.todayBackupById[h.id]) {
      todayBackupById[h.id] = normalized.todayBackupById[h.id]
    }
  }

  return {
    date: today,
    habits: baseHabits,
    statusById,
    streakById,
    lastCompleteDateById,
    todayBackupById
  }
}

function loadHabitPayloadFromStorage({ seedIfEmpty = true } = {}) {
  let parsed = null
  let hasStoredPayload = false

  try {
    const text = localStorage.getItem(HABIT_STORAGE_KEY)
    if (text) {
      parsed = JSON.parse(text)
      hasStoredPayload = true
    }
  } catch {
    parsed = null
    hasStoredPayload = false
  }

  return {
    hasStoredPayload,
    payload: hydrateHabitPayload(parsed, { seedIfEmpty })
  }
}

function saveHabitPayloadToStorage(payload) {
  try {
    localStorage.setItem(HABIT_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage failures
  }
}

function buildHabitPayloadFromNames(habitNames = []) {
  const habits = habitNames
    .map((name) => (typeof name === "string" ? name.trim().slice(0, 20) : ""))
    .filter(Boolean)
    .map((name) => ({ id: makeId(), name }))

  const statusById = {}
  for (const h of habits) statusById[h.id] = 0

  return {
    date: getLocalDateKey(),
    habits,
    statusById,
    streakById: {},
    lastCompleteDateById: {},
    todayBackupById: {}
  }
}

function buildHabitPayloadFromState({
  habits = [],
  statusById = {},
  streakById = {},
  lastCompleteDateById = {},
  todayBackupById = {}
}) {
  const nextStatusById = {}
  const nextStreakById = {}
  const nextLastCompleteDateById = {}
  const nextTodayBackupById = {}

  for (const h of habits) {
    const s = Number(statusById[h.id] ?? 0)
    nextStatusById[h.id] = s === 1 || s === 2 ? s : 0
    const streak = Number(streakById[h.id] ?? 0)
    nextStreakById[h.id] = Number.isFinite(streak) && streak > 0 ? streak : 0
    nextLastCompleteDateById[h.id] =
      typeof lastCompleteDateById[h.id] === "string" ? lastCompleteDateById[h.id] : ""
    const backup = todayBackupById[h.id]
    if (backup && typeof backup === "object") {
      const prevDate = typeof backup.prevDate === "string" ? backup.prevDate : ""
      const prevStreak = Number(backup.prevStreak ?? 0)
      nextTodayBackupById[h.id] = {
        prevDate,
        prevStreak: Number.isFinite(prevStreak) && prevStreak > 0 ? prevStreak : 0
      }
    }
  }

  return {
    date: getLocalDateKey(),
    habits,
    statusById: nextStatusById,
    streakById: nextStreakById,
    lastCompleteDateById: nextLastCompleteDateById,
    todayBackupById: nextTodayBackupById
  }
}

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

function getDefaultReminderItems() {
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

function sanitizeReminderItem(item, fallbackId) {
  const safe = item && typeof item === "object" ? item : {}
  const id = typeof safe.id === "string" && safe.id ? safe.id : fallbackId
  const enabled = Boolean(safe.enabled)
  const intervalMin = clampIntervalMinutes(safe.intervalMin, 60)
  const title = sanitizeText(safe.title, "Reminder", 60)
  const body = typeof safe.body === "string" ? safe.body.trim().slice(0, 160) : ""
  const nextAt = typeof safe.nextAt === "number" ? safe.nextAt : null
  return { id, enabled, intervalMin, title, body, nextAt }
}

function normalizeReminderPayload(parsed) {
  const items = Array.isArray(parsed?.items) ? parsed.items : null
  if (!items) {
    return { version: REMINDER_STORAGE_VERSION, items: getDefaultReminderItems() }
  }
  const normalized = items
    .slice(0, MAX_REMINDERS)
    .map((it, idx) => sanitizeReminderItem(it, `r_${idx}`))
  return { version: REMINDER_STORAGE_VERSION, items: normalized }
}

function migrateLegacyReminderPayload(parsed) {
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
        ? Date.now() + hydrationIntervalMin * 60 * 1000
        : null

  const eyeRestNextAt =
    typeof parsed?.eyeRestNextAt === "number"
      ? parsed.eyeRestNextAt
      : eyeRestEnabled
        ? Date.now() + eyeRestIntervalMin * 60 * 1000
        : null

  return {
    version: REMINDER_STORAGE_VERSION,
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

function loadReminderPayloadFromStorage() {
  try {
    const raw = localStorage.getItem(REMINDER_STORAGE_KEY)
    if (!raw) return { version: REMINDER_STORAGE_VERSION, items: getDefaultReminderItems() }
    const parsed = JSON.parse(raw)

    if (parsed?.version === REMINDER_STORAGE_VERSION || Array.isArray(parsed?.items)) {
      return normalizeReminderPayload(parsed)
    }

    if (
      typeof parsed?.hydrationEnabled !== "undefined" ||
      typeof parsed?.eyeRestEnabled !== "undefined"
    ) {
      return migrateLegacyReminderPayload(parsed)
    }

    return { version: REMINDER_STORAGE_VERSION, items: getDefaultReminderItems() }
  } catch {
    return { version: REMINDER_STORAGE_VERSION, items: getDefaultReminderItems() }
  }
}

function saveReminderPayloadToStorage(payload) {
  try {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore storage failures
  }
}

export {
  HABIT_STORAGE_KEY,
  REMINDER_STORAGE_KEY,
  REMINDER_STORAGE_VERSION,
  MAX_REMINDERS,
  getLocalDateKey,
  normalizeHabitPayload,
  hydrateHabitPayload,
  loadHabitPayloadFromStorage,
  saveHabitPayloadToStorage,
  buildHabitPayloadFromNames,
  buildHabitPayloadFromState,
  normalizeReminderPayload,
  loadReminderPayloadFromStorage,
  saveReminderPayloadToStorage
}