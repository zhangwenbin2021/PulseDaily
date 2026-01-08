"use client"

import { useState } from "react"

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      {/* Beginner note:
          This is a simple "switch" button. It only updates local state for now. */}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-slate-900 bg-slate-900"
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

// ReminderToggles:
// Footer settings area (we'll later connect this to real notifications or email).
export default function ReminderToggles() {
  const [dailyReminder, setDailyReminder] = useState(false)
  const [streakNudge, setStreakNudge] = useState(false)

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">Reminders</h2>

      <ToggleRow
        label="Daily reminder"
        description="A gentle prompt to check in once per day."
        checked={dailyReminder}
        onChange={setDailyReminder}
      />

      <ToggleRow
        label="Streak nudge"
        description="Extra reminder if you’re about to break a streak."
        checked={streakNudge}
        onChange={setStreakNudge}
      />

      <p className="text-xs text-slate-400">
        Note: These toggles are UI-only for now.
      </p>
    </div>
  )
}

