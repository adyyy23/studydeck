import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "StudyDeck — Study smarter. Together.",
  description: "A complete mobile-first student study ecosystem with spaced repetition, contextual AI, multiplayer study rooms, and exam planning.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E3A8A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var i = 0; i < regs.length; i++) { regs[i].unregister(); }
                  });
                }
                if (typeof window !== 'undefined' && 'caches' in window) {
                  caches.keys().then(function(keys) {
                    for (var i = 0; i < keys.length; i++) { caches.delete(keys[i]); }
                  });
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-brand-100 dark:selection:bg-brand-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
