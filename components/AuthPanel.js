"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function AuthPanel() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const displayName = useMemo(() => {
    if (!user) return ""
    return user.user_metadata?.full_name || user.email || ""
  }, [user])

  useEffect(() => {
    let isMounted = true

    supabase.auth.getUser().then(({ data, error: userError }) => {
      if (!isMounted) return
      if (userError) {
        setError(userError.message)
        return
      }
      setUser(data?.user ?? null)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleGoogleSignIn = async () => {
    setError("")
    setIsLoading(true)
    try {
      const redirectTo = `${window.location.origin}/auth/callback`
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo
        }
      })

      if (signInError) {
        setError(signInError.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setError("")
    setIsLoading(true)
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        setError(signOutError.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-900">Account</h2>
          <p className="text-xs text-slate-500">
            Sign in with Google to keep your data synced across devices.
          </p>
        </div>
        {user ? (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isLoading}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing out..." : "Sign out"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Connecting..." : "Continue with Google"}
          </button>
        )}
      </div>
      <div className="mt-3 text-xs text-slate-500">
        {user ? `Signed in as ${displayName}` : "Not signed in yet."}
      </div>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </section>
  )
}
