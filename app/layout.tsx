// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Digital Specification Estimation",
  description: "Smart Attendance & Payroll Management",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  icons: {
    // Main favicon
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon1.png', type: 'image/png', sizes: '32x32' },
      { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    // Apple touch icons
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    // Other icons
    other: [
      {
        rel: 'mask-icon',
        url: '/icon0.svg',
        color: '#000000',
      },
    ],
  },
  // For web app manifest
  applicationName: 'Digital Specification Estimation',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Digital Specification Estimation',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Digital Specification Estimation',
    title: 'Digital Specification Estimation',
    description: 'Smart Attendance & Payroll Management',
  },
  twitter: {
    card: 'summary',
    title: 'Digital Specification Estimation',
    description: 'Smart Attendance & Payroll Management',
  },
};

export const viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}