# I Built PulseDaily: a Local‑First, No‑Login Habit Tracker (Next.js + Tailwind)

I just shipped **PulseDaily** — a mobile‑first habit tracker that runs entirely in your browser. **No signup, no login**. Your data stays on your device (localStorage by default).

Live site: [PulseDaily habit tracker](https://pulsedaily.codezs.online/)

---

## Why I built it

I’ve tried a lot of habit trackers, and I kept running into the same friction:

- You’re forced to create an account before you can even try it
- Too many features up front = decision fatigue
- “Gentle reminders” exist, but the setup is often more work than the habit itself

PulseDaily is my attempt at a **tiny, fast, low‑commitment** alternative: open it, add a habit, and get through Day 1.

---

## What PulseDaily does

### 1) Habit management (add/edit/delete)

Create habits quickly, keep names short, and adjust anytime. It’s designed for one‑hand mobile use.

### 2) 3‑state daily check‑ins + a Momentum bar

Each habit has three daily states:

- `0` — not started
- `1` — partially done
- `2` — fully done

The Momentum bar counts **only fully done** habits. The idea is to avoid “gaming the progress bar” and instead keep the signal honest.

### 3) Reminders: custom interval + custom message

You can create up to **20** fixed‑interval reminders:

- Enable/disable toggle
- Edit / delete
- **Test now** (sends one notification + sound, without changing your schedule)
- Notifications use the browser **Notification API**
- Optional **beep sound** via WebAudio

> Note: This intentionally does **not** try to keep reminding you after the page is closed. It’s meant to be lightweight.

### 4) Shareable template landing pages (one‑click import)

For cold start, I added a few template pages (Study / Fitness / Focus). Instead of sharing a generic homepage link, you can share a **specific “starter set”** like:

[Study habit tracker template](https://pulsedaily.codezs.online/templates/study)

Users can click **Use this template** and PulseDaily will write those habits into localStorage and redirect to `/`.

---

## Tech stack (quick overview)

- Framework: **Next.js** (App Router)
- Styling: **TailwindCSS**
- Storage: **localStorage** (local‑first)
- Notifications: Browser **Notification API**
- Sound: **WebAudio** (short beep)
- Analytics: **Google Analytics** (early funnel visibility)

### Why localStorage?

I wanted “try it instantly” to be the default. For many people, a small habit tracker doesn’t need accounts or sync — it needs **low friction**. If usage proves it’s worth it, optional sync can come later.

---

## Cold start: what I did to make links work better

Early on, the biggest challenge is not building features — it’s getting people to click and understand the product quickly. So I focused on three basics:

1. **OpenGraph/Twitter cards** so shares look credible and clickable
2. **robots.txt + sitemap** so search engines can discover pages faster
3. **Template landing pages** so a link can match a person’s intent (study vs fitness vs focus)

These are small changes, but they can make a big difference when you’re starting from zero.

---

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

---

## What’s next (roadmap)

If people find it useful, the next things I’ll prioritize:

- A simple **Share** button on template pages (copy link + suggested text)
- Clearer onboarding so first‑time users can succeed in 10 seconds
- Better analytics events (e.g. `template_apply`, `enable_reminder`, `export_data`)
- Optional: import flow to match export/backup

---

## Feedback wanted

If you try it, I’d love to hear:

- Is the first‑time experience obvious?
- Do reminders feel helpful or annoying?
- Which templates would you want next? (ADHD, writing, meditation, gym, etc.)

Link: [PulseDaily (habit tracker)](https://pulsedaily.codezs.online/)  
Thanks for reading!
