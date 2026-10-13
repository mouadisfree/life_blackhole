import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { MotionProvider } from "@/components/providers/motion-provider";
import { SkyBackground } from "@/components/sky/sky-background";
import { getDirection } from "@/i18n/config";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const og = { url: "/api/og", width: 1200, height: 630, alt: t("title") };
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
    openGraph: {
      type: "website",
      siteName: t("title"),
      title: t("title"),
      description: t("description"),
      images: [og],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [og.url],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a5aa8",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = await getTranslations("Nav");

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col overflow-x-hidden">
        <a
          href="#main"
          className="sr-only rounded-md bg-cloud px-4 py-2 text-sky-top focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
        >
          {t("skipToContent")}
        </a>
        <SkyBackground />
        <NextIntlClientProvider>
          <MotionProvider>{children}</MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
