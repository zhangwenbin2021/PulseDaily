export default function AuthCodeErrorPage() {
  return (
    <div className="mx-auto max-w-xl space-y-3 rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">
        We couldn&apos;t finish signing you in
      </h1>
      <p className="text-sm text-slate-600">
        Please try again. If the issue keeps happening, confirm your Supabase
        redirect URL settings and Google OAuth configuration.
      </p>
    </div>
  )
}