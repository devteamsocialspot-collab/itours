import type { Metadata, Viewport } from "next";
import { Fira_Sans_Extra_Condensed } from "next/font/google";
import { Toaster } from "sonner";
import { ApolloClientProvider } from "@/lib/apollo/provider";
import { LocaleProvider } from "@/lib/i18n";
import { requestContext } from "@/lib/server";
import "./globals.css";

// one face for headings and body; next/font self-hosts it at build time.
// cyrillic-ext carries the Mongolian Ө ө Ү ү (U+04AE–04E9), which plain "cyrillic" lacks
const fira = Fira_Sans_Extra_Condensed({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-fira",
});

export const metadata: Metadata = {
  // makes preview image URLs absolute; unset, Next falls back to localhost
  metadataBase: process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined,
  title: { default: "itours.mn — trips that keep their promises", template: "%s · itours.mn" },
  description: "Integrated booking system for Mongolian travel agencies, ranked by how well trips match their promises.",
};

// "cover" so env(safe-area-inset-bottom) is real on iPhones: the phone book bar pads itself clear of the home indicator
export const viewport: Viewport = { viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await requestContext();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={fira.variable}
    >
      {/* extensions (password managers, recorders) add their own attributes to <body> before React hydrates */}
      <body suppressHydrationWarning>
        <LocaleProvider initial={locale}>
          <ApolloClientProvider>{children}</ApolloClientProvider>
          <Toaster position="top-center" richColors closeButton />
        </LocaleProvider>
      </body>
    </html>
  );
}
