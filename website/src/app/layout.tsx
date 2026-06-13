import type { Metadata, Viewport } from "next";
import { Hind, Yusei_Magic } from "next/font/google";
import "./globals.css";

const hind = Hind({
  variable: "--font-hind",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const yuseiMagic = Yusei_Magic({
  variable: "--font-yusei-magic",
  subsets: ["latin"],
  weight: "400",
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
  themeColor: "#f9f6f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${hind.variable} ${yuseiMagic.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
