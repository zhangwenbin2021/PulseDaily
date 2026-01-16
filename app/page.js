"use client"

import DailyChecklist from "@/components/DailyChecklist"
import HabitManager from "@/components/HabitManager"
import MomentumBar from "@/components/MomentumBar"
import ReminderModule from "@/components/ReminderModule"
import { useMemo, useState } from "react"

function getLocalDateKey(date = new Date()) {
  // Local date in YYYY-MM-DD so streaks reset with the user's day.
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// This is the home page ("/").
// In the App Router, pages are React components exported from app/**/page.js.
export default function HomePage() {
  // Beginner note:
  // We keep the "source of truth" state here so multiple components can share it.
  // Later, we can sync this state to LocalStorage.
  const [habits, setHabits] = useState([])
  // 0 = empty, 1 = partial, 2 = full
  const [statusById, setStatusById] = useState({})
  const [streakById, setStreakById] = useState({})
  const [lastCompleteDateById, setLastCompleteDateById] = useState({})
  const [todayBackupById, setTodayBackupById] = useState({})
  const [hasHydrated, setHasHydrated] = useState(false)

  function addHabit(name) {
    const trimmed = name.trim().slice(0, 20)
    if (!trimmed) return false

    const exists = habits.some(
      (h) => h.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) return false

    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(16).slice(2)}`

    setHabits((prev) => [{ id, name: trimmed }, ...prev])
    setStatusById((prev) => ({ ...prev, [id]: 0 }))
    setStreakById((prev) => ({ ...prev, [id]: 0 }))
    setLastCompleteDateById((prev) => ({ ...prev, [id]: "" }))
    return true
  }

  function updateHabitName(id, nextName) {
    const trimmed = nextName.trim().slice(0, 20)
    if (!trimmed) return false

    const conflict = habits.some(
      (h) => h.id !== id && h.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (conflict) return false

    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, name: trimmed } : h))
    )
    return true
  }

  function deleteHabit(id) {
    setHabits((prev) => prev.filter((h) => h.id !== id))
    setStatusById((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setStreakById((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setLastCompleteDateById((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setTodayBackupById((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function setHabitStatus(id, nextValue) {
    const prevState = statusById[id] ?? 0
    const now = new Date()
    const today = getLocalDateKey(now)
    const yesterdayDate = new Date(now)
    yesterdayDate.setDate(now.getDate() - 1)
    const yesterday = getLocalDateKey(yesterdayDate)
    const lastCompleteDate = lastCompleteDateById[id] ?? ""
    const prevStreak = Number(streakById[id] ?? 0)

    setStatusById((prev) => ({ ...prev, [id]: nextValue }))

    if (nextValue === 2 && prevState !== 2) {
      if (lastCompleteDate === today) return
      const nextStreak = lastCompleteDate === yesterday ? prevStreak + 1 : 1
      setTodayBackupById((prev) => ({
        ...prev,
        [id]: { prevDate: lastCompleteDate, prevStreak }
      }))
      setLastCompleteDateById((prev) => ({ ...prev, [id]: today }))
      setStreakById((prev) => ({ ...prev, [id]: nextStreak }))
      return
    }

    if (prevState === 2 && nextValue !== 2 && lastCompleteDate === today) {
      const backup = todayBackupById[id]
      const restoredDate = backup?.prevDate ?? ""
      const restoredStreak = Number(backup?.prevStreak ?? 0)
      setLastCompleteDateById((prev) => ({ ...prev, [id]: restoredDate }))
      setStreakById((prev) => ({ ...prev, [id]: restoredStreak }))
      setTodayBackupById((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  function hydrateFromStorage({
    habits: nextHabits,
    statusById: nextStatuses,
    streakById: nextStreaks,
    lastCompleteDateById: nextLastDates,
    todayBackupById: nextBackups
  }) {
    // This is called once on app mount (from HabitManager).
    setHabits(Array.isArray(nextHabits) ? nextHabits : [])
    setStatusById(nextStatuses && typeof nextStatuses === "object" ? nextStatuses : {})
    setStreakById(nextStreaks && typeof nextStreaks === "object" ? nextStreaks : {})
    setLastCompleteDateById(
      nextLastDates && typeof nextLastDates === "object" ? nextLastDates : {}
    )
    setTodayBackupById(
      nextBackups && typeof nextBackups === "object" ? nextBackups : {}
    )
    setHasHydrated(true)
  }

  const { completedHabits, totalHabits } = useMemo(() => {
    const total = habits.length
    const completed = habits.reduce((sum, h) => {
      const s = statusById[h.id] ?? 0
      // Momentum Bar counts ONLY fully completed habits.
      return sum + (s === 2 ? 1 : 0)
    }, 0)
    return { completedHabits: completed, totalHabits: total }
  }, [habits, statusById])

  return (
    <div className="space-y-6">
      {/* Live Momentum Bar (fixed at the very top of the page). */}
      <MomentumBar completedHabits={completedHabits} totalHabits={totalHabits} />

      {/* A quick overview section users see first on mobile. */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Today</h2>
        <p className="mt-1 text-xs text-slate-500">
          Your daily progress and habits live here.
        </p>
      </section>

      {/* Feature placeholders (we'll add real habit logic later). */}
      <HabitManager
        habits={habits}
        statusById={statusById}
        onAddHabit={addHabit}
        onUpdateHabitName={updateHabitName}
        onDeleteHabit={deleteHabit}
        onHydrate={hydrateFromStorage}
      />
      <DailyChecklist
        habits={habits}
        statusById={statusById}
        onSetStatus={setHabitStatus}
        hasHydrated={hasHydrated}
        streakById={streakById}
        lastCompleteDateById={lastCompleteDateById}
        todayBackupById={todayBackupById}
      />

      {/* Bottom-of-page reminder module */}
      <ReminderModule />
    </div>
  )
}
