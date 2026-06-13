import type { Metadata, Viewport } from "next";
import { EB_Garamond, Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Custod — Your silent guardian",
  description:
    "A privacy-first, cross-platform check engine light for burnout. Custod fuses browser, computer, phone, and desk signals into one real-time green, yellow, or red status — before you crash.",
  applicationName: "Custod",
  icons: {
    icon: "/seo/favicon.svg",
    apple: "/seo/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#22C55E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ebGaramond.variable} ${inter.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white font-sans text-[#0f172a]">
        {children}
      </body>
    </html>
  );
}
