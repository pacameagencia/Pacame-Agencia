import type { Metadata } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GlobalChromeTop, GlobalChromeBottom } from "@/components/layout/GlobalChrome";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { ReferralTrackerProvider } from "@/lib/modules/referrals/components/ReferralTrackerProvider";

// Fraunces: serif expressivo mediterráneo, variable axes (SOFT/WONK/opsz)
// Con `axes`, no pasamos weight/style (los gestiona el sistema variable)
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

// Instrument Sans: humanista moderna, contraste tipográfico con Fraunces
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Backcompat vars (para no romper referencias existentes)
const spaceGrotesk = { variable: "--font-space-grotesk" };
const inter = { variable: "--font-inter" };
const playfairDisplay = { variable: "--font-playfair" };

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
    other: {
      "facebook-domain-verification": "rehhyn7no1pavyifad76quzrb8m21x",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}
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
      </head>
      <body className="bg-paper text-ink font-body antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-terracotta-500 focus:text-paper focus:rounded-sm focus:text-sm focus:font-body"
        >
          Saltar al contenido
        </a>
        <GlobalChromeTop />
        <main id="main-content">{children}</main>
        <GlobalChromeBottom />
        <GoogleAnalytics />
        <ReferralTrackerProvider />
      </body>
    </html>
  );
}
