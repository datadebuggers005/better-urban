"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import { Button, ErrorNote, FieldLabel, Select, TextInput, Wordmark } from "@/components/ui";
import { useApp } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

function AuthScreen() {
  const router = useRouter();
  const cities = useApp((s) => s.cities);
  const login = useApp((s) => s.login);
  const signup = useApp((s) => s.signup);

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cityId, setCityId] = useState("metro");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const result = await login(email, password);
        if (!result.ok) {
          setError(result.error ?? "Could not sign in.");
          return;
        }
        router.push("/app");
        return;
      }
      const result = await signup({ name, email, password, cityId });
      if (!result.ok) {
        setError(result.error ?? "Could not create the account.");
        return;
      }
      router.push("/app");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppFrame nav={false}>
      <div className="flex min-h-full flex-col px-5 pb-6 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={BRAND.logo} alt={BRAND.name} className="h-6 w-auto rounded object-contain" />
            <Wordmark small />
          </div>
          <span className="label-caps">Citizen &amp; Staff Access</span>
        </div>

        <div className="mt-5">
          <span className="label-caps">Our City, Our Responsibility</span>
          <h1 className="mt-1.5 font-display text-[24px] font-semibold leading-tight tracking-tight">
            {mode === "signin" ? `Sign in to ${BRAND.name}` : `Join ${BRAND.name}`}
          </h1>
          <p className="mt-1.5 max-w-[330px] text-[12.5px] leading-relaxed text-muted">
            Report civic issues with photos and GPS, track live ward resolution, and collaborate with city officers.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-xl border border-line bg-white p-1">
          {(["signin", "signup"] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setError(null);
              }}
              className={cn(
                "rounded-lg py-2 text-[12px] font-semibold transition",
                mode === item ? "bg-primary text-white" : "text-muted hover:text-ink",
              )}
            >
              {item === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {mode === "signup" ? (
            <div>
              <FieldLabel>Full name</FieldLabel>
              <TextInput
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          ) : null}

          <div>
            <FieldLabel>Email</FieldLabel>
            <TextInput
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@ocor.city"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <FieldLabel hint={mode === "signin" ? "Your password" : "6+ characters"}>
              Password
            </FieldLabel>
            <div className="relative">
              <TextInput
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-paper"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <FieldLabel>City</FieldLabel>
            <Select value={cityId} onChange={(event) => setCityId(event.target.value)}>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </Select>
          </div>

          {error ? <ErrorNote>{error}</ErrorNote> : null}

          <Button size="lg" className="w-full" onClick={submit} disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="mt-auto pt-5 text-center text-[11px] text-muted">
          {mode === "signin" ? "New citizen?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-semibold text-primary underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </div>

        <p className="mt-3 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted/70">
          <Link href="/landing" className="hover:text-ink">
            About {BRAND.fullName}
          </Link>
        </p>
      </div>
    </AppFrame>
  );
}

export default function AuthPage() {
  return (
    <HydrationGate>
      <AuthScreen />
    </HydrationGate>
  );
}
