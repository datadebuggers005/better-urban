# Better Urban

**Better Together.** A 3 km civic + emergency dispatch network.

One citizen report fans out to the municipal control room, verified NGOs and every
citizen inside a 3 km radius — then stays public until the fix is done and rated.

Built for the **Tutedude Buildathon 2026** (CityFix track) by a 5-person team.

> **Prototype disclosure:** this is a buildathon prototype. All cities, citizens,
> tickets, stars and dispatch events are seeded demo data stored in your browser.
> Authority and NGO notifications are simulated. Better Urban is not affiliated
> with any government body and uses no official logos.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm start          # serve the build
npm run typecheck  # tsc --noEmit
```

No environment variables, keys or external services are required. The "backend"
is a mock database in `localStorage` (`betterurban.db.v1`), seeded on first load
with 5 cities, 1,600 citizens and 70 tickets.

### Demo accounts

| Account | Email | Password |
|---|---|---|
| Demo citizen (recommended) | `demo@betterurban.app` | `demo1234` |
| Any seeded citizen | `<first>@betterurban.app` | `demo1234` |

On `/auth`, the fastest path is **Continue with demo citizen** — no OTP, no email.
Reset the whole demo from **Profile → Reset demo** (or clear the localStorage key).

---

## What works

- Splash → onboarding → sign in / create account (email or phone + password)
- City switch across 5 fictional cities (20 sectors each)
- Report flow: category → sub-issue → photo (compressed) → GPS/manual pin →
  brief note → anonymous toggle → submit
- 3 km dispatch: authority + NGO + citizen counts computed with real haversine
  distance over seeded coordinates
- Alert-dispatched screen with radius visual and informed-channel list
- Ticket tracking: 5-step resolution trail, event timeline, SLA countdown,
  volunteer response, share, feedback rating
- My complaints (all / open / resolved), in-app notifications with read state
- Volunteer hub: skills, stars, helped count, city rank, nearby alerts
- City + global leaderboard
- Profile: edit details, alert radius, preferred alert categories, reset demo
- Ops console (`/admin`) to move ticket status and trigger reporter notifications
- Marketing landing page at `/landing`
- Installable manifest + icon (PWA shell)

### Deliberately not built

OTP/SMS, real payments, push notifications, native app, real map tiles, real
authority integration, live LLM calls. The AI triage is a deterministic
on-device simulation, clearly labelled **Demo AI**.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (`@theme` tokens) |
| State / mock backend | Zustand 5 with `persist` (localStorage) |
| Icons | lucide-react |
| Motion | framer-motion (installed, used sparingly) |
| Fonts | Inter + Sora via `next/font/google` |
| Hosting target | Vercel |

No API keys, no third-party data, no AI calls at runtime. Photo compression is
done locally with `<canvas>`.

---

## Structure

```
app/
  page.tsx                 splash
  onboarding/              three-slide intro
  auth/                    sign in / sign up / demo login
  app/                     home (city, volunteer, categories, nearby alerts)
  report/[category]/       report flow
  report/sent/[id]/        dispatch confirmation
  track/[id]/              ticket detail + feedback
  my-reports/              complaint list
  notifications/           in-app alerts
  volunteer/               volunteer hub
  leaderboard/             city + global rankings
  profile/                 account, alert settings, reset
  admin/                   simulated ops console
  landing/                 marketing page
components/                UI kit, phone frame, nav, cards, radius graphic
lib/
  types.ts                 domain types
  catalog.ts               cities/categories/statuses/orgs
  seed.ts                  deterministic demo data
  store.ts                 mock backend actions + persistence
  geo.ts image.ts format.ts utils.ts
docs/
  agent.md                 working memory / architecture context
  features.md              feature checklist + schedule
  log.md                   append-only build log
```

---

## Design

- Cream `#f7f4ec` surfaces, ink navy `#0e1d38`, hairline `#e5e0d3`,
  gold `#e3a33c` for stars, green `#1c8c57` for resolved states.
- Sora for display, Inter for body.
- On desktop the product renders inside a 430 px phone canvas; on mobile it is
  full-bleed with a fixed bottom nav.

See `docs/agent.md` for the full token and route reference.

---

## Scoring model (demo)

Report **+10**, feedback **+10**, join volunteer **+15**, help a neighbour **+25**.
Ranks are computed from stars within the selected city.

SLA targets by severity: critical 6h · high 24h · medium 72h · low 120h.

---

## Roadmap

Supabase/Postgres migration, real Gemini vision triage, authority + NGO
onboarding, web push, WhatsApp reporting, sector budget transparency, cleanup
drives, sponsor rewards.

---

## Credits

Built during the Tutedude Buildathon 2026. Open-source libraries used under their
respective licences (Next.js, React, Tailwind CSS, Zustand, lucide, framer-motion).
All product copy, brand and seeded data are original to this project.
