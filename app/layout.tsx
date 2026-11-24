import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { StoreHydrator } from "@/components/store-hydrator";

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
  title: "Better Urban — Better Together",
  description:
    "One report alerts authorities, NGOs and every citizen inside 3 km. Better Urban is a civic and emergency dispatch network for Indian cities.",
  applicationName: "Better Urban",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Better Urban" },
};

export const viewport: Viewport = {
  themeColor: "#f7f4ec",
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
