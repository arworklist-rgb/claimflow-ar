import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import { TopNav } from "@/components/layout/top-nav";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ClaimFlow AR", template: "%s · ClaimFlow AR" },
  description: "Claim denial workflow for US medical billing teams — interactive demo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${plusJakarta.variable} ${plexMono.variable}`}>
      <body>
        <Providers>
          <TopNav />
          <main className="min-w-0 flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
