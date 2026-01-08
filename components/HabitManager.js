"use client"

import { useEffect, useMemo, useRef, useState } from "react"

function IconPencil(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconTrash(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <path
        d="M3 6h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconPlus(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconX(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID()
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function normalizeHabitName(value) {
  return value.trim().slice(0, 20)
}

const STORAGE_KEY = "pulseDailyData"

function getLocalDateKey(date = new Date()) {
  // Local date in YYYY-MM-DD so resets happen based on the user's day.
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function normalizeStoredData(raw) {
  // Expected shape:
  // { date: "YYYY-MM-DD", habits: [{id,name}], statusById: { [id]: 0|1|2 } }
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

  // Ensure every habit has a valid status (0..2) and remove unknown keys.
  const nextStatusById = {}
  for (const h of habits) {
    const s = Number(statusById[h.id] ?? 0)
    nextStatusById[h.id] = s === 1 || s === 2 ? s : 0
  }

  return {
    date: typeof raw?.date === "string" ? raw.date : "",
    habits,
    statusById: nextStatusById
  }
}

function ActionButton({ label, onClick, tone = "neutral", children }) {
  const toneClasses =
    tone === "danger"
      ? "text-rose-600 hover:bg-rose-50"
      : "text-slate-600 hover:bg-slate-100"

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-xl transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20",
        toneClasses
      ].join(" ")}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

// HabitManager:
// "Zero-Friction Management" lets users add/edit/delete habits (no login).
export default function HabitManager({
  habits: habitsProp,
  statusById,
  onAddHabit,
  onUpdateHabitName,
  onDeleteHabit,
  onHydrate
}) {
  // Suggestion tags that follow the "Two-Minute Rule" (quick, easy habits).
  const suggestions = useMemo(
    () => ["Drink Water", "Read 1 Page", "Walk 5 Min"],
    []
  )

  // Beginner note:
  // This component is reusable. If you pass `habits` + callbacks as props,
  // it becomes "controlled" by a parent component. Otherwise it uses local state.
  const [localHabits, setLocalHabits] = useState([])
  const habits = habitsProp ?? localHabits

  const [isAdding, setIsAdding] = useState(false)
  const [newHabitName, setNewHabitName] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState("")

  const inputRef = useRef(null)
  const didHydrateRef = useRef(false)

  useEffect(() => {
    // LocalStorage read + date-awareness:
    // - Load habits + completion status once on mount.
    // - If stored date !== today, reset completion status (but keep habits).
    // - If LocalStorage is empty, initialize with sample habits.
    if (!onHydrate || didHydrateRef.current) return

    didHydrateRef.current = true

    const today = getLocalDateKey()

    let loaded = null
    try {
      const text = localStorage.getItem(STORAGE_KEY)
      if (text) loaded = JSON.parse(text)
    } catch {
      loaded = null
    }

    const normalized = normalizeStoredData(loaded)

    // If empty storage, seed with two sample habits.
    const initialHabits =
      normalized.habits.length === 0
        ? [
            { id: makeId(), name: "Drink Water" },
            { id: makeId(), name: "Read 1 Page" }
          ]
        : normalized.habits

    // Date check: new day => reset all statuses to 0.
    const shouldReset = normalized.date !== today
    const initialStatusById = {}
    for (const h of initialHabits) initialStatusById[h.id] = shouldReset ? 0 : (normalized.statusById[h.id] ?? 0)

    onHydrate({ habits: initialHabits, statusById: initialStatusById })
  }, [onHydrate])

  function addHabit(rawName) {
    const name = normalizeHabitName(rawName)
    if (!name) return

    const addFn =
      onAddHabit ??
      ((habitName) => {
        const exists = localHabits.some(
          (h) => h.name.toLowerCase() === habitName.toLowerCase()
        )
        if (exists) return false
        setLocalHabits((prev) => [{ id: makeId(), name: habitName }, ...prev])
        return true
      })

    addFn(name)
    setIsAdding(false)
    setNewHabitName("")
  }

  function deleteHabit(id) {
    const delFn =
      onDeleteHabit ??
      ((habitId) =>
        setLocalHabits((prev) => prev.filter((h) => h.id !== habitId)))

    delFn(id)
    if (editingId === id) {
      setEditingId(null)
      setEditingName("")
    }
  }

  function startEditing(habit) {
    setEditingId(habit.id)
    setEditingName(habit.name)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingName("")
  }

  function saveEditing() {
    const nextName = normalizeHabitName(editingName)
    if (!nextName) return

    const updateFn =
      onUpdateHabitName ??
      ((habitId, habitName) => {
        const conflict = localHabits.some(
          (h) =>
            h.id !== habitId && h.name.toLowerCase() === habitName.toLowerCase()
        )
        if (conflict) return false
        setLocalHabits((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, name: habitName } : h))
        )
        return true
      })

    const ok = updateFn(editingId, nextName)
    if (ok) cancelEditing()
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Zero‑Friction Management
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Add, edit, or delete habits in seconds — no login required.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding((v) => !v)
            // Focus after the input renders.
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        >
          <IconPlus />
          Add
        </button>
      </div>

      {/* Add input (shown after pressing "+") */}
      {isAdding ? (
        <div className="mt-4">
          <label className="sr-only" htmlFor="new-habit">
            Habit name
          </label>
          <div className="flex items-center gap-2">
            <input
              id="new-habit"
              ref={inputRef}
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value.slice(0, 20))}
              onKeyDown={(e) => {
                if (e.key === "Enter") addHabit(newHabitName)
                if (e.key === "Escape") {
                  setIsAdding(false)
                  setNewHabitName("")
                }
              }}
              maxLength={20}
              placeholder='e.g., "Drink Water"'
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
              inputMode="text"
              autoComplete="off"
            />

            <button
              type="button"
              onClick={() => addHabit(newHabitName)}
              disabled={!normalizeHabitName(newHabitName)}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Max 20 characters.</span>
            <span className="tabular-nums">
              {normalizeHabitName(newHabitName).length}/20
            </span>
          </div>

          {/* One-click suggestions */}
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-600">
              Two‑Minute Rule suggestions
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addHabit(tag)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Habit list */}
      <div className="mt-4">
        {habits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4">
            <p className="text-xs text-slate-500">
              No habits yet. Tap <span className="font-semibold">Add</span> or
              use a suggestion.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {habits.map((habit) => {
              const isEditing = editingId === habit.id
              return (
                <li
                  key={habit.id}
                  className="group rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    {isEditing ? (
                      <div className="flex w-full items-center gap-2">
                        <label className="sr-only" htmlFor={`edit-${habit.id}`}>
                          Edit habit name
                        </label>
                        <input
                          id={`edit-${habit.id}`}
                          value={editingName}
                          onChange={(e) =>
                            setEditingName(e.target.value.slice(0, 20))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditing()
                            if (e.key === "Escape") cancelEditing()
                          }}
                          maxLength={20}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-900/5"
                        />

                        <ActionButton label="Save" onClick={saveEditing}>
                          <IconCheck />
                        </ActionButton>
                        <ActionButton label="Cancel" onClick={cancelEditing}>
                          <IconX />
                        </ActionButton>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {habit.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Keep it tiny. Keep it daily.
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                          <ActionButton
                            label="Edit habit"
                            onClick={() => startEditing(habit)}
                          >
                            <IconPencil />
                          </ActionButton>
                          <ActionButton
                            label="Delete habit"
                            onClick={() => deleteHabit(habit.id)}
                            tone="danger"
                          >
                            <IconTrash />
                          </ActionButton>
                        </div>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
