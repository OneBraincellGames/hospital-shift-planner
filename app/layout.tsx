import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/client";
import { getT, getLocale } from "@/lib/i18n/server";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Schichtplaner",
  description: "Hospital shift planning tool",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <I18nProvider translations={t}>{children}</I18nProvider>
      </body>
    </html>
  );
}
