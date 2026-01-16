"use client"

const STORAGE_KEY = "pulseDailyData"

function IconBackup(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4"
      {...props}
    >
      <path
        d="M4 7a3 3 0 0 1 3-3h8l5 5v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M15 4v5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 11v6m0 0-2-2m2 2 2-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getFileDateKey(date = new Date()) {
  // YYYYMMDD (no separators) for filenames.
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

export default function ExportButton({ storageKey = STORAGE_KEY }) {
  function handleBackup() {
    // Beginner note (Blob API):
    // 1) Convert JS object -> JSON string
    // 2) Create a Blob (file-like object in memory)
    // 3) Create an object URL for that Blob
    // 4) Programmatically click an <a download> link
    // 5) Revoke the object URL to avoid memory leaks
    let payload = null

    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) payload = JSON.parse(raw)
    } catch {
      payload = null
    }

    // If storage is empty/corrupted, export a safe minimal shape.
    const safePayload =
      payload && typeof payload === "object"
        ? payload
        : {
            date: "",
            habits: [],
            statusById: {},
            streakById: {},
            lastCompleteDateById: {},
            todayBackupById: {}
          }

    const fileName = `pulseDaily_backup_${getFileDateKey()}.json`
    const json = JSON.stringify(safePayload, null, 2)
    const blob = new Blob([json], { type: "application/json;charset=utf-8" })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={handleBackup}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
        "text-slate-600 transition hover:bg-slate-100 hover:text-slate-900",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
      ].join(" ")}
      aria-label="Backup"
      title="Backup"
    >
      <IconBackup />
      Backup
    </button>
  )
}
