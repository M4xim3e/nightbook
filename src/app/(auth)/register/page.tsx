'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [venueName, setVenueName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async () => {
    setLoading(true)
    setError('')

    if (!venueName || !email || !password) {
      setError('Tous les champs sont obligatoires')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const slug = venueName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { error: venueError } = await supabase
        .from('venues')
        .insert({ user_id: data.user.id, name: venueName, slug })

      if (venueError) {
        setError('Erreur lors de la création du profil')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">NightBook</h1>
          <p className="text-zinc-400">Créez votre espace établissement</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <h2 className="text-xl font-semibold text-white mb-6">Créer un compte</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Nom de l'établissement</label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
                placeholder="Le Club, Duplex..."
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition"
                placeholder="Min. 6 caractères"
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Création...' : 'Créer mon espace'}
            </button>
          </div>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
