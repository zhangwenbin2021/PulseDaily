"use client"

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max)
}

// MomentumBar:
// Live progress bar that updates as users complete habits.
export default function MomentumBar({ completedHabits = 0, totalHabits = 0 }) {
  // Progress calculation (as requested):
  // percent = (fully completed habits / total habits) * 100
  // If there are no habits, percent stays at 0%.
  const safeTotal = Math.max(0, totalHabits)
  const safeDone = clamp(completedHabits, 0, safeTotal)
  const percent = safeTotal === 0 ? 0 : Math.round((safeDone / safeTotal) * 100)

  return (
    // Full-width thin bar at the very top of the page.
    <div className="fixed left-0 right-0 top-0 z-20">
      <div className="h-2 w-full bg-gray-200">
        <div
          // Smooth animation on progress changes.
          className="h-2 rounded-r-full bg-gradient-to-r from-gray-200 to-emerald-500 transition-all duration-300 ease-in-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Daily momentum"
        />
      </div>
    </div>
  )
}
