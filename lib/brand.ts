// Central brand configuration. Override via NEXT_PUBLIC_* env vars to rebrand.
export const BRAND = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "OCOR",
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Our City, Our Responsibility",
  line:
    process.env.NEXT_PUBLIC_APP_LINE ||
    "We don't just solve problems. We build civilised citizens.",
  short: process.env.NEXT_PUBLIC_APP_SHORT || "OCOR",
  fullName:
    process.env.NEXT_PUBLIC_APP_FULL_NAME ||
    `${process.env.NEXT_PUBLIC_APP_NAME || "OCOR"} — ${
      process.env.NEXT_PUBLIC_APP_TAGLINE || "Our City, Our Responsibility"
    }`,
  logo: process.env.NEXT_PUBLIC_APP_LOGO || "/ocor-logo.jpg",
  icon: process.env.NEXT_PUBLIC_APP_ICON || "/icon.svg",
  codePrefix: process.env.NEXT_PUBLIC_CODE_PREFIX || "OCOR",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@ocor.city",
  hashtags: (
    process.env.NEXT_PUBLIC_HASHTAGS || "#OCOR,#OurCityOurResponsibility"
  )
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),
};

export type BrandConfig = typeof BRAND;
