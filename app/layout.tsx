import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clearline",
  description: "Your commute, confirmed.",
  applicationName: "Clearline",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Clearline",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#efece2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
