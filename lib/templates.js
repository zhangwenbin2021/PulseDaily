export const templates = [
  {
    slug: "study",
    title: "Study Sprint",
    tagline: "A tiny daily routine for focused learning.",
    bullets: [
      "Read 10 minutes",
      "Flashcards (5 min)",
      "One practice problem",
      "Write 3-line summary",
      "Plan tomorrow (2 min)"
    ]
  },
  {
    slug: "fitness",
    title: "Fitness Starter",
    tagline: "Minimal habits that stack into consistency.",
    bullets: [
      "Walk 10 minutes",
      "10 squats",
      "Stretch 2 minutes",
      "Drink water",
      "Sleep: lights out on time"
    ]
  },
  {
    slug: "focus",
    title: "Focus & Calm",
    tagline: "Lower friction, clearer mind.",
    bullets: [
      "2-minute breathing",
      "Desk reset (1 min)",
      "No-phone first 10 minutes",
      "Write top 1 priority",
      "Short reflection"
    ]
  }
]

export function getTemplateBySlug(slug) {
  return templates.find((t) => t.slug === slug) || null
}

