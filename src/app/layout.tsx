import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/ui/themeProvider";
import { Toaster } from "~/components/ui/sonner";
import { PartyProvider } from "~/utils/PartyProvider";
import TailwindIndicator from "./_components/twIndicator";
import { env } from "~/env";

export const metadata: Metadata = {
  title: "GuessRealm",
  description: "A multiplayer anime character guessing game",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
            <Toaster />
            <PartyProvider>{children}</PartyProvider>
            {env.NODE_ENV === "development" && <TailwindIndicator />}
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
