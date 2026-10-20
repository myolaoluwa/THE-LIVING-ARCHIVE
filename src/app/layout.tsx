import type { Metadata, Viewport } from "next";
import { env } from "@/config/env";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Edmund Spencer Katso — The Living Archive",
    template: "%s | Edmund Spencer Katso",
  },
  description:
    "Explore the books and life of Edmund Spencer Katso, Zimbabwean-born author, educator and historian. History remembered. Stories preserved.",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "The Living Archive",
    locale: "en_GB",
    title: "Edmund Spencer Katso — The Living Archive",
    description: "History remembered. Stories preserved.",
  },
};
export const viewport: Viewport = { themeColor: "#F5F0E7" };
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
