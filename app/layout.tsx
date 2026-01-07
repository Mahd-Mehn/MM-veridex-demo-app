import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VeridexProvider } from "@/lib/VeridexContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veridex | Cross-Chain Passkey Wallet",
  description: "Create a cross-chain crypto wallet with just your fingerprint or face. No seed phrase. No gas fees. 5 chains, 1 identity.",
  metadataBase: new URL('https://demo.veridex.network'),
  openGraph: {
    title: "Veridex | Cross-Chain Passkey Wallet",
    description: "I just created a cross-chain wallet with my face 🔐 No seed phrase to lose. No gas fees to pay. 5 chains, 1 identity.",
    url: 'https://demo.veridex.network',
    siteName: 'Veridex',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Veridex - Cross-Chain Passkey Wallet',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Veridex | Cross-Chain Passkey Wallet",
    description: "Create a cross-chain wallet with your fingerprint or face. No seed phrase. No gas fees. The future of crypto UX.",
    images: ['/og-image.svg'],
    creator: '@VeridexProtocol',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <VeridexProvider>
          {children}
        </VeridexProvider>
      </body>
    </html>
  );
}
