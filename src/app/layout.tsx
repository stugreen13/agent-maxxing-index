import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Maxxing Index — Live developer activity across GitHub, npm, PyPI, and more",
  description: "Live dashboard tracking daily developer activity across npm downloads, PyPI installs, and GitHub commits.",
  openGraph: {
    type: "website",
    siteName: "Agent Maxxing Index",
    title: "Agent Maxxing Index — Live developer activity across GitHub, npm, PyPI, and more",
    description: "Live dashboard tracking daily developer activity across npm downloads, PyPI installs, and GitHub commits.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Maxxing Index — Live developer activity across GitHub, npm, PyPI, and more",
    description: "Live dashboard tracking daily developer activity across npm downloads, PyPI installs, and GitHub commits.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <noscript>
          <img
            src="https://queue.simpleanalyticscdn.com/noscript.gif"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
      </body>
      <Script
        src="https://scripts.simpleanalyticscdn.com/latest.js"
        strategy="afterInteractive"
      />
    </html>
  );
}
