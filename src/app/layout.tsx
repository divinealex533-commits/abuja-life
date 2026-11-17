import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReferralCapture from "@/components/referral/ReferralCapture";
import ErrorReporter from "@/components/system/ErrorReporter";
import GamePhone from "@/components/life/GamePhone";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://abuja-life-deedee-backend.vercel.app";

const DESCRIPTION =
  "Live your life in Abuja: work real jobs from POS Agent to Surgeon, buy houses and cars, run businesses, chat with players and win weekend cash prizes.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Abuja Life — Live the Abuja Dream",
    template: "%s · Abuja Life",
  },
  description: DESCRIPTION,
  applicationName: "Abuja Life",
  keywords: [
    "Abuja Life",
    "Nigerian game",
    "life simulation",
    "Abuja",
    "online game Nigeria",
  ],
  openGraph: {
    type: "website",
    siteName: "Abuja Life",
    title: "Abuja Life — Live the Abuja Dream",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_NG",
  },
  twitter: {
    card: "summary",
    title: "Abuja Life — Live the Abuja Dream",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ReferralCapture />
        <ErrorReporter />
        <GamePhone />
      </body>
    </html>
  );
}
