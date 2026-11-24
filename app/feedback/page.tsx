"use client";

import { useState } from "react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import { Button, EmptyState, PageHeader, TextArea } from "@/components/ui";
import { API_BASE } from "@/lib/api";
import { useApp } from "@/lib/store";
import { Star } from "lucide-react";

function FeedbackScreen() {
  const user = useApp((s) => s.users.find((u) => u.id === s.sessionUserId));
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please write a message.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, rating }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("sent");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send feedback");
    }
  }

  if (status === "sent") {
    return (
      <AppFrame>
        <PageHeader title="Feedback" subtitle="Thanks for helping us improve." />
        <div className="px-5 py-10 text-center">
          <p className="font-display text-[18px] font-semibold">Thanks for your feedback!</p>
          <p className="mt-2 text-[12.5px] text-muted">We read every message.</p>
          <Button className="mt-6" onClick={() => setStatus("idle")}>Send another</Button>
        </div>
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <PageHeader title="Send feedback" subtitle="Tell us what to fix or build next." />
      <form onSubmit={submit} className="space-y-4 px-5 pb-6">
        <div>
          <label className="label-caps">Name</label>
          <input
            className="field mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="label-caps">Email (optional)</label>
          <input
            className="field mt-1.5"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label-caps">Rating</label>
          <div className="mt-1.5 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-1"
                aria-label={`Rate ${n} of 5`}
              >
                <Star
                  className={`size-6 ${n <= rating ? "fill-gold text-gold" : "text-muted/40"}`}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label-caps">Message</label>
          <TextArea
            className="mt-1.5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What should we improve?"
            rows={5}
          />
        </div>
        {error && <p className="text-[12px] text-danger">{error}</p>}
        <Button type="submit" disabled={status === "sending"} className="w-full">
          {status === "sending" ? "Sending…" : "Send feedback"}
        </Button>
      </form>
    </AppFrame>
  );
}

export default function FeedbackPage() {
  return (
    <HydrationGate>
      <FeedbackScreen />
    </HydrationGate>
  );
}
