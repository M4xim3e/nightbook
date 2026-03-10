'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScanLine, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const [restaurantName, setRestaurantName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { restaurant_name: restaurantName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError("Erreur lors de la création du compte.")
      setLoading(false)
      return
    }

    // Sign in immediately to get session
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Compte créé mais connexion échouée. Veuillez vous connecter manuellement.')
      setLoading(false)
      return
    }

    // Create restaurant record
    const { error: restaurantError } = await supabase.from('restaurants').insert({
      name: restaurantName,
      owner_id: data.user.id,
      email,
      phone: phone || null,
      subscription_status: 'trialing',
    })

    if (restaurantError) {
      setError('Erreur lors de la création du restaurant: ' + restaurantError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a4731] to-[#0d2b1e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <ScanLine className="h-9 w-9 text-[#1a4731]" />
            </div>
            <span className="text-2xl font-bold text-white">FreshTrack</span>
          </Link>
          <div className="mt-3 inline-flex items-center gap-2 bg-green-500/20 text-green-200 px-4 py-1.5 rounded-full text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            14 jours gratuits, sans CB
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Créer mon compte</h1>
          <p className="text-gray-500 text-sm mb-6">Commencez votre essai gratuit de 14 jours</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Nom du restaurant *</Label>
              <Input
                id="restaurantName"
                type="text"
                placeholder="Le Petit Bistrot"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="chef@monrestaurant.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (pour les SMS d'alerte)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Répétez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Création du compte...' : 'Commencer mon essai gratuit'}
            </Button>

            <p className="text-center text-xs text-gray-400">
              En créant un compte, vous acceptez nos{' '}
              <Link href="/legal/cgu" className="underline">
                CGU
              </Link>{' '}
              et notre{' '}
              <Link href="/legal/privacy" className="underline">
                politique de confidentialité
              </Link>
            </p>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-[#1a4731] font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
