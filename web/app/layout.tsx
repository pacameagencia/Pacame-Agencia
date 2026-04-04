import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://pacame.es"),
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
  authors: [{ name: "PACAME", url: "https://pacame.es" }],
  creator: "PACAME",
  publisher: "PACAME",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://pacame.es",
    siteName: "PACAME",
    title: "PACAME — Tu equipo digital. Sin límites.",
    description:
      "7 agentes IA especializados para tu empresa. Web, SEO, Ads, Social, Branding. Entrega en días, no semanas.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PACAME — Tu equipo digital. Sin límites.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PACAME — Tu equipo digital. Sin límites.",
    description:
      "7 agentes IA especializados para tu empresa. Entrega en días, no semanas.",
    creator: "@pacameagencia",
    images: ["/og-image.jpg"],
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
    canonical: "https://pacame.es",
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
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="bg-pacame-black text-pacame-white font-body antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
