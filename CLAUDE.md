@AGENTS.md

# Hospital Shift Planner

Web app for hospital shift managers and staff.

---

## Project Context (Wiki)

At session start, read these wiki pages for full project context:

- `C:/git/GameDev/Claude/wiki/sources/project-hospital-shift-planner.md` — project architecture and key facts
  (wiki page not yet created — run ingest to generate it)

### Key facts

- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database:** PostgreSQL via Neon, ORM: Prisma
- **Deploy:** Vercel + Neon
- **GitHub:** https://github.com/OneBraincellGames/hospital-shift-planner
- **Shifts:** Mon–Fri (Early/Late/Night), Sat–Sun (Day/Night); 3–10 stations
- **Users:** Manager (plans/approves) + Staff (preferences, swap requests)
