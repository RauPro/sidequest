import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Pixelify_Sans } from "next/font/google";
import "./globals.css";

const pixelify = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "SIDEQUEST · Willow Market", template: "%s · SIDEQUEST" },
  description: "An explorable demo storefront for collectible desk companions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body className={pixelify.variable}><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
