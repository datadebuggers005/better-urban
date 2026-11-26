import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { StoreHydrator } from "@/components/store-hydrator";
import { BRAND } from "@/lib/brand";
import { OCOR_PALETTE } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: BRAND.fullName,
  description:
    "Our City, Our Responsibility — report civic issues, track live ward resolution maps, and collaborate with city officers.",
  applicationName: BRAND.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: BRAND.name },
};

export const viewport: Viewport = {
  themeColor: OCOR_PALETTE.core.surfaceLight,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sora.variable}`}>
        <StoreHydrator />
        {children}
      </body>
    </html>
  );
}
