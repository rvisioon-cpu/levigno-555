import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google"; // Using fonts closer to original (Montserrat/Inter)
import "./globals.css";
import config from "@/config/config";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import IdentityTheme from "@/components/IdentityTheme";
import ServiceWorkerRegistrar from "@/components/layout/ServiceWorkerRegistrar";
import UseLandscape from "@/components/layout/UseLandscape";
import ForcedLandscapeWrapper from "@/components/layout/ForcedLandscapeWrapper";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-primary",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-secondary",
});

export const metadata: Metadata = {
  title: config.appName,
  description: config.appDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${montserrat.variable} ${inter.variable} antialiased h-screen w-screen overflow-hidden bg-black text-white`}
      >
        <ServiceWorkerRegistrar />
        <IdentityTheme />
        <UseLandscape />
        <ForcedLandscapeWrapper>
          <AnalyticsTracker />
          {children}
        </ForcedLandscapeWrapper>
      </body>
    </html>
  );
}
