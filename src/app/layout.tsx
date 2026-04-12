import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/ui/themeProvider";
import { Toaster } from "~/components/ui/sonner";
import { PartyProvider } from "~/utils/PartyProvider";
import TailwindIndicator from "./_components/twIndicator";
import VisitTracker from "./_components/visitTracker";
import { env } from "~/env";

const siteName = "GuessRealm";
const siteDescription =
  "GuessRealm is a multiplayer anime character guessing game where players ask yes/no questions, narrow down possibilities, and race to guess their assigned character first.";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "GuessRealm | Multiplayer Anime Character Guessing Game",
    template: "%s | GuessRealm",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "GuessRealm",
    "anime guessing game",
    "anime trivia",
    "multiplayer party game",
    "character guessing",
    "online anime game",
  ],
  alternates: {
    canonical: "/",
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: "GuessRealm | Multiplayer Anime Character Guessing Game",
    description: siteDescription,
    images: [
      {
        url: "/logo.png",
        alt: "GuessRealm logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GuessRealm | Multiplayer Anime Character Guessing Game",
    description: siteDescription,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#5800a6",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <VisitTracker />
            <Toaster />
            <PartyProvider>{children}</PartyProvider>
            {env.NODE_ENV === "development" && <TailwindIndicator />}
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
