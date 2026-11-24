import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Camera,
  Check,
  HandHeart,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/ui";
import { RadiusGraphic } from "@/components/radius-graphic";

export const metadata: Metadata = {
  title: "Better Urban — One report alerts 3 km of your city",
  description:
    "Better Urban is a civic and emergency dispatch network. Report an issue once and alert authorities, NGOs and every citizen within 3 km. Track the fix, rate it, close the loop.",
};

const STEPS = [
  {
    icon: Camera,
    title: "Report in 20 seconds",
    body: "Pick a category, add a photo, drop the pin. No forms, no call centres, no queue.",
  },
  {
    icon: Radio,
    title: "3 km alert fan-out",
    body: "Authorities, verified NGOs and every citizen inside the radius are pinged at once.",
  },
  {
    icon: BarChart3,
    title: "Watch the trail",
    body: "A public timeline with an SLA countdown. You always know who has the ticket.",
  },
  {
    icon: Star,
    title: "Rate the fix",
    body: "Resolved only counts when the citizen confirms it. That rating becomes public trust.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI photo triage",
    body: "The photo suggests the category, sub-issue and severity — one tap to accept. Demo AI is simulated today; the API shape is ready.",
  },
  {
    icon: HandHeart,
    title: "Volunteer response",
    body: "Citizens with first-aid or traffic skills accept nearby alerts, earn stars and get recognised on the city leaderboard.",
  },
  {
    icon: Bell,
    title: "Status, not silence",
    body: "Every status change fires a notification to the reporter: acknowledged, crew assigned, resolved, rated.",
  },
  {
    icon: ShieldCheck,
    title: "Anonymous when it matters",
    body: "Sensitive reports can hide the reporter's identity while still reaching responders inside the radius.",
  },
  {
    icon: Trophy,
    title: "Sector leaderboards",
    body: "Stars for reporting, verifying and helping turn civic duty into a habit loop instead of a one-off complaint.",
  },
  {
    icon: Building2,
    title: "A console for the city",
    body: "A simulated ops console lets a control room move tickets through the workflow and trigger citizen updates.",
  },
];

function MiniHome() {
  return (
    <div className="w-full max-w-[300px] rounded-[1.6rem] border border-line bg-paper p-3 shadow-[0_30px_60px_-30px_rgba(14,29,56,0.45)]">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted">Select city</p>
          <p className="text-[13px] font-semibold">Metro City</p>
        </div>
        <span className="flex size-6 items-center justify-center rounded-full border border-line bg-white">
          <Bell className="size-3" />
        </span>
      </div>
      <div className="mt-2 rounded-xl border border-line bg-white p-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-cream">AM</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold">Aarav Mehta</p>
            <p className="text-[8px] text-muted">Sector 18 · 24 helped</p>
          </div>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-soft px-1.5 py-0.5 text-[8px] font-bold text-[#8a5f17]">
            <Star className="size-2 fill-gold text-gold" /> 488
          </span>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {[
          ["Road & Traffic", "Jam, potholes"],
          ["Fire & Disaster", "Fire, flood, gas"],
          ["Medical", "Accident, injury"],
          ["Waste", "Garbage dump"],
        ].map(([name, sub]) => (
          <div key={name} className="rounded-lg border border-line bg-white px-2 py-2">
            <p className="text-[9px] font-semibold">{name}</p>
            <p className="text-[7.5px] text-muted">{sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-lg border border-line bg-white p-2">
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-semibold">Potholes / Damaged Road</p>
          <span className="rounded-full bg-gold-soft px-1.5 py-0.5 text-[6.5px] font-bold uppercase text-[#8a5f17]">
            In progress
          </span>
        </div>
        <p className="mt-0.5 text-[7.5px] text-muted">Sector 18 Main Rd · 0.6 km away</p>
        <div className="mt-1.5 flex items-center gap-1">
          <span className="h-1 flex-1 rounded-full bg-ink/80" />
          <span className="h-1 flex-1 rounded-full bg-ink/80" />
          <span className="h-1 flex-1 rounded-full bg-line" />
          <span className="h-1 flex-1 rounded-full bg-line" />
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-paper text-ink">
      <div className="app-backdrop">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-5 sm:px-8">
          {/* nav */}
          <header className="flex items-center justify-between rounded-2xl border border-line bg-paper/90 px-4 py-3 backdrop-blur">
            <Link href="/landing" className="flex items-center gap-2">
              <BrandMark size={30} />
              <span className="font-display text-[15px] font-semibold tracking-tight">Better Urban</span>
            </Link>
            <nav className="hidden items-center gap-6 text-[12px] text-muted md:flex">
              <a href="#problem" className="hover:text-ink">Problem</a>
              <a href="#how" className="hover:text-ink">How it works</a>
              <a href="#features" className="hover:text-ink">Features</a>
              <a href="#impact" className="hover:text-ink">Impact</a>
            </nav>
            <Link
              href="/auth"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[12px] font-semibold text-cream"
            >
              Open app <ArrowRight className="size-3.5" />
            </Link>
          </header>

          {/* hero */}
          <section className="mt-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] md:mt-16">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                <span className="size-1.5 rounded-full bg-green" />
                Civic + emergency dispatch network
              </span>
              <h1 className="mt-4 font-display text-[38px] font-semibold leading-[1.05] tracking-tight sm:text-[46px] lg:text-[52px]">
                One report.
                <br />
                Three responders.
                <br />
                <span className="text-ink/45">Three kilometres.</span>
              </h1>
              <p className="mt-4 max-w-[520px] text-[14px] leading-relaxed text-muted sm:text-[15px]">
                Better Urban turns a single citizen complaint into a coordinated response. Your report
                immediately reaches the municipal control room, verified NGOs and every neighbour inside
                3 km — then stays public until someone actually fixes it.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link
                  href="/auth"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[13px] font-semibold text-cream shadow-[0_18px_36px_-22px_rgba(14,29,56,0.9)]"
                >
                  Try the demo citizen <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-[13px] font-semibold"
                >
                  See how it works
                </a>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1"><Check className="size-3" /> No OTP in demo</span>
                <span className="inline-flex items-center gap-1"><Check className="size-3" /> 5 cities, 1,600 demo citizens</span>
                <span className="inline-flex items-center gap-1"><Check className="size-3" /> Works on any phone</span>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(227,163,60,0.22),transparent_65%)]" />
              <MiniHome />
              <div className="absolute -left-2 bottom-8 hidden rounded-xl border border-line bg-white px-3 py-2 shadow-lg lg:block">
                <p className="text-[9px] uppercase tracking-[0.12em] text-muted">Alert dispatched</p>
                <p className="text-[11px] font-semibold">BU-2048 · 63 citizens pinged</p>
              </div>
              <div className="absolute -right-2 top-6 hidden rounded-xl border border-line bg-white px-3 py-2 shadow-lg lg:block">
                <p className="text-[9px] uppercase tracking-[0.12em] text-muted">Closed the loop</p>
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold">
                  <Star className="size-3 fill-gold text-gold" /> 5.0 citizen rating
                </p>
              </div>
            </div>
          </section>

          {/* problem */}
          <section id="problem" className="mt-16 md:mt-24">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="label-caps">The problem</p>
                <h2 className="mt-1 max-w-[620px] font-display text-[26px] font-semibold leading-tight tracking-tight sm:text-[34px]">
                  Cities don&apos;t lack complaints. They lack a loop that closes.
                </h2>
              </div>
              <p className="max-w-[340px] text-[12.5px] leading-relaxed text-muted">
                Existing civic apps are report-and-forget: a ticket goes in, silence comes out. Citizens
                stop reporting, staff lose signal, and the same pothole is filed five times.
              </p>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                {
                  k: "01",
                  t: "Reports vanish",
                  b: "A photo goes to a portal with no owner, no SLA and no public trail. You never learn what happened.",
                },
                {
                  k: "02",
                  t: "Responders work blind",
                  b: "Authorities and local NGOs don't see the same map. Neighbours who could help in minutes are never told.",
                },
                {
                  k: "03",
                  t: "No proof, no trust",
                  b: "A status says 'resolved' but nobody verifies it. Without citizen sign-off, every claim looks the same.",
                },
              ].map((item) => (
                <div key={item.k} className="rounded-2xl border border-line bg-white p-5">
                  <p className="font-mono text-[10px] text-muted">{item.k}</p>
                  <p className="mt-3 font-display text-[15px] font-semibold">{item.t}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{item.b}</p>
                </div>
              ))}
            </div>
          </section>

          {/* how */}
          <section id="how" className="mt-16 md:mt-24">
            <p className="label-caps">How it works</p>
            <h2 className="mt-1 font-display text-[26px] font-semibold tracking-tight sm:text-[34px]">
              Four steps. One accountable trail.
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="relative rounded-2xl border border-line bg-white p-5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-cream">
                      <Icon className="size-4" />
                    </span>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Step {index + 1}
                    </p>
                    <p className="mt-1 font-display text-[14.5px] font-semibold">{step.title}</p>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* dispatch */}
          <section className="mt-16 grid items-center gap-8 rounded-3xl border border-line bg-ink px-5 py-8 text-cream sm:px-8 md:mt-24 md:grid-cols-[1fr_1fr] md:py-12">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/50">
                The 3 km network
              </p>
              <h2 className="mt-2 font-display text-[28px] font-semibold leading-tight tracking-tight sm:text-[34px]">
                Help is not a helpline. It&apos;s your neighbourhood.
              </h2>
              <p className="mt-3 max-w-[460px] text-[13px] leading-relaxed text-cream/65">
                The moment a report lands, Better Urban fans it out to three channels at once. The radius
                is computed from real coordinates — on the demo, every alerted citizen is a seeded profile
                inside 3 km.
              </p>
              <div className="mt-5 space-y-2.5">
                {[
                  { icon: Building2, t: "Authorities", b: "Municipal control room + traffic police get the ticket, code and evidence." },
                  { icon: HandHeart, t: "Verified NGOs", b: "Local response partners see severity, location and who is already responding." },
                  { icon: Users, t: "Citizens inside 3 km", b: "Neighbours get pinged to verify, guide or help — the closest help is usually a person." },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.t} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                      <Icon className="mt-0.5 size-4 shrink-0 text-gold" />
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold">{row.t}</p>
                        <p className="text-[10.5px] leading-relaxed text-cream/60">{row.b}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <RadiusGraphic radiusKm={3} />
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                {[
                  ["3.0 km", "radius"],
                  ["63", "citizens pinged"],
                  ["3", "channels"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg bg-white/5 px-2 py-2">
                    <p className="font-display text-[15px] font-semibold">{value}</p>
                    <p className="text-[8.5px] uppercase tracking-[0.1em] text-cream/50">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* features */}
          <section id="features" className="mt-16 md:mt-24">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="label-caps">Inside the product</p>
                <h2 className="mt-1 font-display text-[26px] font-semibold tracking-tight sm:text-[34px]">
                  Built past &ldquo;report an issue&rdquo;.
                </h2>
              </div>
              <Link href="/auth" className="hidden items-center gap-1 text-[12px] font-semibold sm:inline-flex">
                Open the prototype <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-2xl border border-line bg-white p-5">
                    <span className="flex size-9 items-center justify-center rounded-xl border border-line bg-paper text-ink">
                      <Icon className="size-4" />
                    </span>
                    <p className="mt-3 font-display text-[14.5px] font-semibold">{feature.title}</p>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{feature.body}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* impact */}
          <section id="impact" className="mt-16 md:mt-24">
            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-line bg-white p-6">
                <p className="label-caps">Why it matters</p>
                <h2 className="mt-1 font-display text-[24px] font-semibold leading-tight tracking-tight">
                  Accountability is the feature. Trust is the outcome.
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                  When a citizen can see the ticket move, the fix get rated, and their own contribution
                  counted, the next report costs less effort. That is how a city moves from complaint
                  volume to response quality.
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    "Citizens: a 20-second report, a public trail, a say in whether it's really fixed.",
                    "Volunteers: nearby alerts matched to skills, stars and visible recognition.",
                    "City teams: one queue, duplicated reports merged, response time on record.",
                  ].map((line) => (
                    <p key={line} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-ink/75">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-green" /> {line}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-line bg-gold-soft/60 p-5">
                  <p className="label-caps text-[#8a5f17]">Next</p>
                  <p className="mt-1 font-display text-[15px] font-semibold">Beyond the prototype</p>
                  <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-ink/70">
                    <li>• Supabase + real authority onboarding</li>
                    <li>• Live Gemini vision triage</li>
                    <li>• WhatsApp reporting for low-literacy users</li>
                    <li>• Sector budget &amp; SLA transparency</li>
                    <li>• Clean-up drives and sponsor rewards</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-line bg-white p-5">
                  <p className="label-caps">Demo, honestly</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    This is a buildathon prototype. Cities, citizens, tickets and dispatch events are
                    seeded demo data. Authority and NGO notifications are simulated. Better Urban is not
                    affiliated with any government body and uses no official logos.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* cta */}
          <section className="mt-16 rounded-3xl border border-line bg-white px-6 py-10 text-center md:mt-24">
            <p className="font-display text-[26px] font-semibold tracking-tight sm:text-[32px]">
              Your street is one report away.
            </p>
            <p className="mx-auto mt-2 max-w-[440px] text-[12.5px] leading-relaxed text-muted">
              Open the demo, pick a category, and watch a 3 km alert go out. No signup required — the demo
              citizen is one tap away.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <Link
                href="/auth"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[13px] font-semibold text-cream"
              >
                Launch Better Urban <ArrowRight className="size-4" />
              </Link>
              <a
                href="#problem"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-5 text-[13px] font-semibold"
              >
                Read the problem
              </a>
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 text-[10.5px] text-muted">
              <MapPin className="size-3" /> Works best on a phone · installable PWA
            </p>
          </section>

          <footer className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BrandMark size={22} />
              <span className="font-display text-[12.5px] font-semibold text-ink">Better Urban</span>
              <span>· Built for the Tutedude Buildathon 2026</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span>#TutedudeBuildathon</span>
              <span>#BuildForMyCity</span>
              <Link href="/auth" className="font-medium text-ink hover:underline">
                Open app
              </Link>
            </div>
          </footer>
          <p className="mt-4 text-[9.5px] uppercase tracking-[0.16em] text-muted/60">
            Prototype · demo data · simulated dispatch · not affiliated with any government
          </p>
        </div>
      </div>
    </main>
  );
}
