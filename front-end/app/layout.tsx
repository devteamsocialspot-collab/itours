import type { Metadata } from "next";
import { Caprasimo, Figtree, Nunito, Rubik } from "next/font/google";
import { Toaster } from "sonner";
import { ApolloClientProvider } from "@/lib/apollo/provider";
import { LocaleProvider } from "@/lib/i18n";
import { requestContext } from "@/lib/server";
import "./globals.css";

// the Organic design system's faces; next/font self-hosts them at build time
const caprasimo = Caprasimo({ weight: "400", subsets: ["latin"], variable: "--font-caprasimo" });
const figtree = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-figtree" });
// Caprasimo and Figtree have no Cyrillic; these rounded faces carry the Mongolian text
const nunito = Nunito({ subsets: ["cyrillic"], variable: "--font-cyr-body" });
// only the 600 face: headings ask for 400 and the browser takes the nearest, matching Caprasimo's heft
const rubik = Rubik({ weight: "600", subsets: ["cyrillic"], variable: "--font-cyr-heading" });

export const metadata: Metadata = {
  // makes preview image URLs absolute; unset, Next falls back to localhost
  metadataBase: process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined,
  title: { default: "itours.mn — trips that keep their promises", template: "%s · itours.mn" },
  description: "Integrated booking system for Mongolian travel agencies, ranked by how well trips match their promises.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await requestContext();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${caprasimo.variable} ${figtree.variable} ${nunito.variable} ${rubik.variable}`}
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
