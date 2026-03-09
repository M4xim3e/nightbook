'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/subscribe', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">NightBook</h1>
          <p className="text-zinc-400">Activez votre abonnement</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div className="text-center mb-8">
            <p className="text-5xl font-bold text-white mb-1">79€</p>
            <p className="text-zinc-500 text-sm">par mois · sans engagement</p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              'Page de reservation publique',
              'Paiement acompte Stripe integre',
              'Emails automatiques + QR code',
              'Liste d\'attente intelligente',
              'Dashboard temps reel',
              'Rappel J-1 automatique',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <span className="text-green-400 text-xs">✓</span>
                </div>
                <span className="text-zinc-300 text-sm">{f}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? 'Redirection...' : 'S\'abonner'}
          </button>

          <p className="text-center text-zinc-600 text-xs mt-4">
            Prelevement automatique chaque mois · Resiliable a tout moment
          </p>
        </div>

        <div className="text-center mt-6 flex items-center justify-center gap-4 text-xs text-zinc-700">
          <a href="/legal/cgv" className="hover:text-zinc-500 transition">CGV</a>
          <span>·</span>
          <a href="/legal/cgu" className="hover:text-zinc-500 transition">CGU</a>
          <span>·</span>
          <a href="/legal/confidentialite" className="hover:text-zinc-500 transition">Confidentialité</a>
          <span>·</span>
          <a href="/legal/mentions-legales" className="hover:text-zinc-500 transition">Mentions légales</a>
        </div>

      </div>
    </div>
  )
}
