import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import WhatsAppButton from "@/components/WhatsAppButton";
import SageChatWidget from "@/components/SageChatWidget";
import CursorGlowWrapper from "@/components/effects/CursorGlowWrapper";
import CookieConsent from "@/components/CookieConsent";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import LoadingScreen from "@/components/effects/LoadingScreen";
import ScrollProgress from "@/components/effects/ScrollProgress";
import NoiseOverlay from "@/components/effects/NoiseOverlay";
import BackToTop from "@/components/effects/BackToTop";
import OrganizationJsonLd from "@/components/seo/OrganizationJsonLd";
import ReferralCookieTracker from "@/components/referral/ReferralCookieTracker";
import BottomNavigation from "@/components/mobile/BottomNavigation";
import AddToHomeScreen from "@/components/mobile/AddToHomeScreen";
import ThemeProvider from "@/components/providers/ThemeProvider";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import CommandPalette from "@/components/command/CommandPalette";
import ExitIntentPopup from "@/components/cro/ExitIntentPopup";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pacameagencia.com"),
  title: {
    default: "PACAME — Tu equipo digital. Sin límites.",
    template: "%s | PACAME Agencia Digital",
  },
  description:
    "Agencia digital con IA especializada. Diseño web, SEO, publicidad, redes sociales y branding para PYMEs españolas. Más rápido, mejor y más barato que una agencia tradicional.",
  keywords: [
    "agencia digital españa",
    "diseño web profesional",
    "agencia marketing digital",
    "SEO para pymes",
    "desarrollo web next.js",
    "agencia IA españa",
    "crear pagina web empresa",
    "meta ads españa",
    "gestión redes sociales",
    "branding para empresas",
  ],
  authors: [{ name: "PACAME", url: "https://pacameagencia.com" }],
  creator: "PACAME",
  publisher: "PACAME",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://pacameagencia.com",
    siteName: "PACAME",
    title: "PACAME — Tu equipo digital completo. Potenciado por IA.",
    description:
      "7 agentes IA especializados para tu empresa. Web, SEO, Ads, Social, Branding. 60% mas barato que una agencia, entrega en dias.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PACAME — Tu equipo digital completo. Potenciado por IA.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PACAME — Tu equipo digital completo. Potenciado por IA.",
    description:
      "7 agentes IA especializados para tu empresa. 60% mas barato que una agencia, entrega en dias.",
    creator: "@pacameagencia",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://pacameagencia.com",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "B2h8SzjtvgC881Mq7jebvGxsYkLM2OQ5mqUcVs6wgyo",
    yandex: process.env.YANDEX_SITE_VERIFICATION,
    other: {
      "facebook-domain-verification":
        process.env.FACEBOOK_DOMAIN_VERIFICATION ||
        "rehhyn7no1pavyifad76quzrb8m21x",
      "msvalidate.01": process.env.BING_SITE_VERIFICATION || "",
      "p:domain_verify": process.env.PINTEREST_DOMAIN_VERIFICATION || "",
    },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PACAME",
    startupImage: [
      { url: "/generated/optimized/mobile/splash-light.webp", media: "(prefers-color-scheme: light)" },
      { url: "/generated/optimized/mobile/splash-dark.webp", media: "(prefers-color-scheme: dark)" },
    ],
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/generated/optimized/mobile/pwa-icon-512.webp", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/generated/optimized/mobile/pwa-icon-512.webp", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/generated/optimized/mobile/pwa-icon-monochrome.webp",
        color: "#B54E30",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1A1813" },
    { media: "(prefers-color-scheme: light)", color: "#F4EFE3" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable}`}
    >
      <head>
        {/* JSON-LD Organization + WebSite (consolidado en OrganizationJsonLd, Sprint 23) */}
        <OrganizationJsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.atlascloud.ai" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="bg-paper text-ink font-sans antialiased">
        <ThemeProvider>
          <SmoothScrollProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-body"
        >
          Saltar al contenido
        </a>
        <LoadingScreen />
        <ScrollProgress />
        <NoiseOverlay />
        <CursorGlowWrapper />
        <Header />
        <Breadcrumbs />
        <main id="main-content">{children}</main>
        <Footer />
        <WhatsAppButton />
        <BackToTop />
        <SageChatWidget />
        <CookieConsent />
        <GoogleAnalytics />
        <ReferralCookieTracker />
        <CommandPalette />
        <ExitIntentPopup />
        <BottomNavigation />
        <AddToHomeScreen />
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
