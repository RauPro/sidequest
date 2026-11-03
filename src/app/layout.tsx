import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Pixelify_Sans } from "next/font/google";
import { KlaviyoIdentityCapture } from "@/features/klaviyo/KlaviyoIdentityCapture";
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
  return <html lang="en"><body className={pixelify.variable}><KlaviyoIdentityCapture><a className="skip-link" href="#main">Skip to content</a>{children}</KlaviyoIdentityCapture></body></html>;
}
