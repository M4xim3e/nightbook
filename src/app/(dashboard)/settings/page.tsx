'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Building2, CreditCard, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { Restaurant } from '@/lib/types/database'

const PLAN_LABELS: Record<string, { name: string; price: string; features: string[] }> = {
  starter: {
    name: 'Starter',
    price: '29€/mois',
    features: ['1 restaurant', '50 scans/mois', 'Alertes email'],
  },
  pro: {
    name: 'Pro',
    price: '49€/mois',
    features: ['Scans illimités', 'Alertes email + SMS', 'Dashboard analytique'],
  },
  multi: {
    name: 'Multi',
    price: '99€/mois',
    features: ["Jusqu'à 5 restaurants", 'Scans illimités', 'Alertes email + SMS'],
  },
}

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  trialing: { label: 'Essai gratuit', variant: 'success' },
  active: { label: 'Actif', variant: 'success' },
  canceled: { label: 'Annulé', variant: 'destructive' },
  past_due: { label: 'Paiement en retard', variant: 'destructive' },
}

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (data) {
        setRestaurant(data)
        setForm({ name: data.name, email: data.email, phone: data.phone || '' })
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveInfo = async () => {
    if (!restaurant) return
    setSaving(true)

    const { error } = await supabase
      .from('restaurants')
      .update({ name: form.name, email: form.email, phone: form.phone || null })
      .eq('id', restaurant.id)

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Informations mises à jour' })
    }
    setSaving(false)
  }

  const handleManageSubscription = async () => {
    if (!restaurant?.stripe_customer_id) {
      // No subscription yet, redirect to pricing
      window.location.href = '/#pricing'
      return
    }

    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurant.id }),
      })

      if (!response.ok) throw new Error('Erreur lors de l\'ouverture du portail')
      const { url } = await response.json()
      window.location.href = url
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' })
      setPortalLoading(false)
    }
  }

  const handleSubscribe = async (priceId: string) => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId, restaurant_id: restaurant?.id }),
      })

      if (!response.ok) throw new Error('Erreur lors de la création de la session')
      const { url } = await response.json()
      window.location.href = url
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' })
    }
  }

  const currentPlan = restaurant?.subscription_plan
  const subscriptionStatus = restaurant?.subscription_status || 'trialing'
  const statusConfig = STATUS_LABELS[subscriptionStatus] || { label: subscriptionStatus, variant: 'secondary' as const }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a4731]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">Gérez vos informations et votre abonnement</p>
      </div>

      {/* Restaurant info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#1a4731]" />
            Informations du restaurant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du restaurant</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email de contact</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
            />
          </div>
          <Button onClick={handleSaveInfo} disabled={saving}>
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-2" />Sauvegarder</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#1a4731]" />
              Abonnement
            </CardTitle>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPlan && PLAN_LABELS[currentPlan] ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Plan {PLAN_LABELS[currentPlan].name}</p>
                  <p className="text-sm text-gray-600">{PLAN_LABELS[currentPlan].price}</p>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {PLAN_LABELS[currentPlan].features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">
              {subscriptionStatus === 'trialing'
                ? 'Vous êtes en période d\'essai gratuit. Choisissez un plan pour continuer après les 14 jours.'
                : 'Aucun plan actif.'}
            </p>
          )}

          {restaurant?.stripe_customer_id ? (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="w-full gap-2"
            >
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Gérer mon abonnement sur Stripe
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Choisissez votre plan :</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(PLAN_LABELS).map(([key, plan]) => (
                  <button
                    key={key}
                    onClick={() => {
                      const priceIds: Record<string, string | undefined> = {
                        starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
                        pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
                        multi: process.env.NEXT_PUBLIC_STRIPE_MULTI_PRICE_ID,
                      }
                      const priceId = priceIds[key]
                      if (priceId) handleSubscribe(priceId)
                    }}
                    className={`p-4 border-2 rounded-xl text-left transition-all hover:border-[#1a4731] ${
                      key === 'pro' ? 'border-[#1a4731] bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    {key === 'pro' && (
                      <span className="text-xs font-bold text-[#1a4731] uppercase tracking-wide">Recommandé</span>
                    )}
                    <p className="font-semibold text-gray-900 mt-1">{plan.name}</p>
                    <p className="text-[#1a4731] font-bold">{plan.price}</p>
                    <ul className="mt-2 space-y-1">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-gray-500">{f}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
