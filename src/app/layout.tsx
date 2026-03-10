import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'FreshTrack — Gestion de stock pour restaurants',
  description:
    'Scannez vos factures, gérez votre stock automatiquement et recevez des alertes avant péremption. Le logiciel indispensable pour les restaurants indépendants français.',
  keywords: 'gestion stock restaurant, péremption, factures, HACCP, restauration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
