import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
    google: "B2h8SzjtvgC881Mq7jebvGxsYkLM2OQ5mqUcVs6wgyo",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PACAME",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#D4A574" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} dark`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "PACAME",
              url: "https://pacameagencia.com",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://pacameagencia.com/servicios?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "PACAME",
              alternateName: "PACAME Agencia Digital",
              url: "https://pacameagencia.com",
              logo: "https://pacameagencia.com/opengraph-image",
              description:
                "Agencia digital con 7 agentes IA especializados. Diseno web, SEO, publicidad digital, redes sociales y branding para PYMEs en Espana.",
              telephone: "+34722669381",
              email: "hola@pacameagencia.com",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Madrid",
                addressCountry: "ES",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 40.4168,
                longitude: -3.7038,
              },
              areaServed: {
                "@type": "Country",
                name: "Espana",
              },
              priceRange: "300 EUR - 15.000 EUR",
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                ],
                opens: "09:00",
                closes: "20:00",
              },
              sameAs: [
                "https://instagram.com/pacameagencia",
                "https://linkedin.com/company/pacame",
                "https://twitter.com/pacameagencia",
              ],
              founder: {
                "@type": "Person",
                name: "Pablo Calleja",
                jobTitle: "CEO",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                reviewCount: "47",
                bestRating: "5",
              },
            }),
          }}
        />
        <OrganizationJsonLd />
      </head>
      <body className="bg-pacame-black text-pacame-white font-body antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-electric-violet focus:text-white focus:rounded-lg focus:text-sm focus:font-body"
        >
          Saltar al contenido
        </a>
        <LoadingScreen />
        <ScrollProgress />
        <NoiseOverlay />
        <CursorGlowWrapper />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <WhatsAppButton />
        <BackToTop />
        <SageChatWidget />
        <CookieConsent />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
