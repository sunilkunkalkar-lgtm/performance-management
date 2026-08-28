import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Suii · Performance Management",
  description: "Cascading OKRs, 1:1 reviews, kudos, skills, and flight-risk radar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const inner = children;
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full antialiased">
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider>{inner}</ClerkProvider>
        ) : (
          inner
        )}
      </body>
    </html>
  );
}
