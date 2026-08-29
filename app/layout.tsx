import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import MobileTabBar from "@/components/ui/MobileTabBar";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "GetYourBrew — AI Coffee Recipe Assistant",
  description:
    "Generate better coffee recipes based on your beans, brew method and gear.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${archivo.variable} font-sans bg-cream text-ink min-h-screen`}
      >
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-10 pb-24 sm:pb-10">{children}</main>
        <MobileTabBar />
      </body>
    </html>
  );
}
