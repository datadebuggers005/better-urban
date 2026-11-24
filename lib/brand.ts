// Central brand configuration. Override via NEXT_PUBLIC_* env vars to rebrand.
export const BRAND = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Better Urban",
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Better Together",
  line: process.env.NEXT_PUBLIC_APP_LINE || "We don't just solve problems. We build civilised citizens.",
  short: process.env.NEXT_PUBLIC_APP_SHORT || "BU",
  logo: process.env.NEXT_PUBLIC_APP_LOGO || "/icon-192.png",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@betterurban.app",
  hashtags: (process.env.NEXT_PUBLIC_HASHTAGS || "#TutedudeBuildathon,#BuildForMyCity").split(","),
};
