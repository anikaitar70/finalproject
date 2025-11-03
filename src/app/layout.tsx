import { type Metadata } from "next";
import { Inter } from "next/font/google";

import {
  Analytics,
  Navbar,
  Providers,
  TailwindIndicator,
  ThemeProvider,
} from "~/components";
import { Toaster } from "~/components/ui/toaster";
import { siteConfig } from "~/config/site";
import { cn } from "~/lib/utils";

import "~/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

interface RootLayoutProps {
  authModal: React.ReactNode;
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  creator: siteConfig.creator,
  authors: siteConfig.authors,
  keywords: siteConfig.keywords,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    url: siteConfig.url,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  metadataBase: new URL(siteConfig.url),
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({ authModal, children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className,
        )}
      >
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Navbar />
            {authModal}

            <div className="container mx-auto h-full max-w-7xl pt-12">
              {children}
            </div>

            <Analytics />
            <TailwindIndicator />
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
