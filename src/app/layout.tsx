import type { Metadata } from "next";
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
  title: "Cluely - Live AI Meeting Assistant | Real-Time Meeting Notes and AI Insights",
  description:
    "AI meeting assistant that provides live meeting notes, instant answers, and real-time insights during calls. Unlike Otter or Granola, helps you during meetings, not just after.",
  applicationName: "Cluely",
  themeColor: "#DDE2EE",
  icons: {
    icon: "/seo/favicon.png",
    apple: "/seo/favicon.png",
  },
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
      <body className="min-h-full flex flex-col bg-white font-sans text-[#19191D]">
        {children}
      </body>
    </html>
  );
}
