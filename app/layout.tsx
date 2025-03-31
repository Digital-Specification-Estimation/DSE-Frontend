"use client";
import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { useRef } from "react";
import { AppStore, makeStore } from "@/lib/store";
import { Provider } from "react-redux";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Digital Specification Estimation",
//   description: "Smart Attendance & Payroll Management",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white`}>
        <Provider store={storeRef.current}>{children}</Provider>
        <Toaster />
      </body>
    </html>
  );
}
