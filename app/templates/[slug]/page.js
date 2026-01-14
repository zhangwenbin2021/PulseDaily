import TemplateCTA from "@/components/TemplateCTA"
import { getTemplateBySlug, templates } from "@/lib/templates"
import Link from "next/link"

export function generateStaticParams() {
  return templates.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }) {
  const t = getTemplateBySlug(params.slug)
  if (!t) return { title: "Template not found" }

  return {
    title: `${t.title} • PulseDaily`,
    description: t.tagline
  }
}

export default function TemplatePage({ params }) {
  const t = getTemplateBySlug(params.slug)

  if (!t) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-900">Template not found</p>
        <Link href="/templates" className="text-sm text-slate-700 underline">
          Back to templates
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/templates" className="text-xs text-slate-500 underline">
        ← Back to templates
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{t.title}</h2>
        <p className="mt-1 text-xs text-slate-500">{t.tagline}</p>

        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-900">Habits included</p>
          <ul className="mt-2 space-y-2">
            {t.bullets.map((h) => (
              <li
                key={h}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              >
                {h}
              </li>
            ))}
          </ul>
        </div>

        <TemplateCTA habitNames={t.bullets} />
      </section>
    </div>
  )
}

