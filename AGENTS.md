# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router entry points, layout, global styles, and route templates.
- `components/`: Reusable UI modules such as habit management, checklist, reminders, and export actions.
- `lib/`: Small shared utilities (e.g., template data helpers).
- `public/`: Static assets (logo, icons, sitemap, robots.txt).
- `.next/`: Build output (generated; do not edit).

## Build, Test, and Development Commands
- `npm run dev`: Start the local Next.js dev server.
- `npm run build`: Create a production build in `.next/`.
- `npm run start`: Run the production server from the build output.
- `npm run lint`: Run Next.js ESLint rules.

## Coding Style & Naming Conventions
- Language: JavaScript (React + Next.js). Components are in `PascalCase` (e.g., `ReminderModule.js`).
- Indentation: 2 spaces, no tabs.
- Prefer concise component-level state and helper functions co-located with UI.
- Styling uses Tailwind utility classes in JSX; keep class lists readable and grouped by purpose.

## Testing Guidelines
- No test framework is configured in `package.json` and no test directory exists.
- If tests are added, keep them close to the feature (e.g., `components/__tests__/`) and name files `*.test.js`.

## Commit & Pull Request Guidelines
- Recent commits use short, descriptive subject lines (Chinese or English) with no prefix, e.g., ?bugfixs?, ?sitemap?.
- Keep commits focused on a single change.
- PRs should include: a brief description, steps to verify, and screenshots for UI changes.

## Configuration & Data Notes
- Client state persists to `localStorage` under keys like `pulseDailyData` and `pulseDailyReminders`.
- Public URLs and SEO metadata are set in `app/layout.js` and `public/sitemap.xml`.
