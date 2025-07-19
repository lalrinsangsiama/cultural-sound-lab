import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GlobalErrorProvider } from "@/components/providers/GlobalErrorProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cultural Sound Lab | AI-Powered Traditional Music Platform",
  description: "Transform authentic cultural recordings into monetizable music assets. AI-powered generation, licensing, and creative tools for traditional music communities.",
  keywords: ["cultural music", "traditional music", "AI music generation", "music licensing", "Mizo music", "indigenous music", "sound design"],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#DC2626",
  authors: [{ name: "Cultural Sound Lab Team" }],
  creator: "Cultural Sound Lab",
  publisher: "Cultural Sound Lab",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://culturalsoundlab.com",
    title: "Cultural Sound Lab | AI-Powered Traditional Music Platform",
    description: "Transform authentic cultural recordings into monetizable music assets. AI-powered generation, licensing, and creative tools for traditional music communities.",
    siteName: "Cultural Sound Lab",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cultural Sound Lab - AI-Powered Traditional Music Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cultural Sound Lab | AI-Powered Traditional Music Platform",
    description: "Transform authentic cultural recordings into monetizable music assets. AI-powered generation, licensing, and creative tools for traditional music communities.",
    images: ["/og-image.png"],
    creator: "@culturalsoundlab",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cultural Sound Lab",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalErrorProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GlobalErrorProvider>
      </body>
    </html>
  );
}
