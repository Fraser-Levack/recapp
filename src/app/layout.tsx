import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { DataProvider } from "@/components/DataProvider";
import { Nav } from "@/components/Nav";
import { ErrorToast } from "@/components/ui";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RecApp",
  description: "Minimal spaced-repetition flashcards.",
  appleWebApp: { capable: true, title: "RecApp", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0d0c" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geistSans.variable}>
        <DataProvider>
          <Nav />
          <main className="mx-auto max-w-2xl px-4 pt-6 pb-32 sm:pt-10 sm:pb-16">{children}</main>
          <ErrorToast />
        </DataProvider>
      </body>
    </html>
  );
}
