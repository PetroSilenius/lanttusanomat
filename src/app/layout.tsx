import type { Metadata, Viewport } from 'next'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import { siteConfig } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} – ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: siteConfig.shortName,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  alternates: {
    types: { 'application/rss+xml': [{ url: '/feed.xml', title: siteConfig.name }] },
  },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    locale: 'fi_FI',
  },
}

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body className="flex min-h-screen flex-col">
        <a
          href="#sisalto"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:font-bold focus:text-brand-dark"
        >
          Siirry sisältöön
        </a>
        <SiteHeader />
        <main id="sisalto" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
        <SiteFooter />
        <OfflineIndicator />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  )
}
