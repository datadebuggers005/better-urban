"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import { Button, ErrorNote, FieldLabel, Select, TextInput, Wordmark } from "@/components/ui";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

function AuthScreen() {
  const router = useRouter();
  const cities = useApp((s) => s.cities);
  const login = useApp((s) => s.login);
  const signup = useApp((s) => s.signup);
  const demoLogin = useApp((s) => s.demoLogin);

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cityId, setCityId] = useState("metro");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (mode === "signin") {
      const result = login(email, password);
      if (!result.ok) {
        setError(result.error ?? "Could not sign in.");
        return;
      }
      router.push("/app");
      return;
    }
    const result = signup({ name, email, password, cityId });
    if (!result.ok) {
      setError(result.error ?? "Could not create the account.");
      return;
    }
    router.push("/app");
  };

  const enterDemo = () => {
    demoLogin();
    router.push("/app");
  };

  return (
    <AppFrame nav={false}>
      <div className="flex min-h-full flex-col px-5 pb-6 pt-5">
        <div className="flex items-center justify-between">
          <Wordmark small />
          <span className="label-caps">Citizen access</span>
        </div>

        <div className="mt-5">
          <span className="label-caps">WF-03 // Sign in</span>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-tight tracking-tight">
            {mode === "signin" ? "Sign in to Better Urban" : "Join Better Urban"}
          </h1>
          <p className="mt-2 max-w-[330px] text-[12.5px] leading-relaxed text-muted">
            Verify your identity to report civic issues and receive local alerts inside a 3 km radius.
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
                mode === item ? "bg-ink text-cream" : "text-muted hover:text-ink",
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
            <FieldLabel>Email or phone</FieldLabel>
            <TextInput
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="+91 98765 43210 or name@city.org"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div>
            <FieldLabel hint={mode === "signin" ? "Demo: demo1234" : "6+ characters"}>
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

          <Button size="lg" className="w-full" onClick={submit}>
            {mode === "signin" ? "Sign in" : "Create account"}
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button variant="secondary" size="lg" className="w-full" onClick={enterDemo}>
          <Sparkles className="size-4" />
          Continue with demo citizen
        </Button>

        <div className="mt-4 rounded-xl border border-line bg-white/70 p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted" />
            <p className="text-[11px] font-semibold">Why demo login?</p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            This prototype stores everything in your browser. OTP and SMS are intentionally disabled.
            Demo account: <span className="font-medium text-ink">demo@betterurban.app</span> /{" "}
            <span className="font-medium text-ink">demo1234</span>
          </p>
        </div>

        <div className="mt-auto pt-5 text-center text-[11px] text-muted">
          {mode === "signin" ? "New citizen?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-semibold text-ink underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </div>

        <p className="mt-3 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted/70">
          <Link href="/landing" className="hover:text-ink">
            About the project
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
