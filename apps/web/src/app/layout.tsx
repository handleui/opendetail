import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "opendetail",
  description:
    "Public site scaffold for docs, demos, and registry distribution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} bg-white font-sans text-black antialiased [--font-sans:var(--font-geist)]`}
      >
        {children}
      </body>
    </html>
  );
}
