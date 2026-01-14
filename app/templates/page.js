import { templates } from "@/lib/templates"
import Link from "next/link"

export const metadata = {
  title: "PulseDaily Templates",
  description: "Starter templates for common goals: study, fitness, focus."
}

export default function TemplatesIndexPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Templates</h2>
        <p className="mt-1 text-xs text-slate-500">
          Pick a starter set and import it into your PulseDaily habits.
        </p>
      </section>

      <section className="space-y-3">
        {templates.map((t) => (
          <Link
            key={t.slug}
            href={`/templates/${t.slug}`}
            className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-sm font-semibold text-slate-900">{t.title}</p>
            <p className="mt-1 text-xs text-slate-500">{t.tagline}</p>
            <p className="mt-3 text-xs text-slate-600">
              Includes: {t.bullets.slice(0, 3).join(" • ")}
              {t.bullets.length > 3 ? " • …" : ""}
            </p>
          </Link>
        ))}
      </section>
    </div>
  )
}

