import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trifold demo — ParallelTrack",
  description:
    "Sideways panel navigation with the trifold package (ParallelTrack, ScrollPanels, Trifold)",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      lang="en"
    >
      <body className="flex min-h-dvh flex-col overflow-hidden">
        <div className="flex min-h-0 min-h-dvh flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
