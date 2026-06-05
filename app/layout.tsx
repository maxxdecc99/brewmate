import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BrewMate — AI Coffee Recipe Assistant",
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
      <body
        className={`${inter.className} bg-[#FAF7F2] text-stone-900 min-h-screen`}
      >
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
