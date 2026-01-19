"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  buildHabitPayloadFromNames,
  loadReminderPayloadFromStorage,
  saveHabitPayloadToStorage
} from "@/lib/pulseStorage"

const supabase = createClient()

export default function TemplateCTA({ habitNames, label = "Use this template" }) {
  const [error, setError] = useState("")

  const payload = useMemo(
    () => buildHabitPayloadFromNames(habitNames),
    [habitNames]
  )

  async function applyTemplate() {
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
      saveHabitPayloadToStorage(payload)
    } catch {
      setError("Could not save to local storage (blocked or full).")
      return
    }

    try {
      const { data } = await supabase.auth.getUser()
      const user = data?.user

      if (user) {
        const { data: existing, error: fetchError } = await supabase
          .from("pulse_user_data")
          .select("reminders_data")
          .eq("user_id", user.id)
          .maybeSingle()

        if (fetchError) throw fetchError

        const remindersPayload = existing?.reminders_data ?? loadReminderPayloadFromStorage()

        const { error: upsertError } = await supabase
          .from("pulse_user_data")
          .upsert({
            user_id: user.id,
            habits_data: payload,
            reminders_data: remindersPayload,
            updated_at: new Date().toISOString()
          })

        if (upsertError) throw upsertError
      }
    } catch (syncError) {
      setError(syncError?.message || "Cloud sync failed.")
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
        If you are signed in, this will sync to your cloud account.
      </p>
    </div>
  )
}
