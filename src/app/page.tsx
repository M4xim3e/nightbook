import Link from 'next/link'
import {
  ScanLine,
  Package,
  Bell,
  CheckCircle2,
  Star,
  ArrowRight,
  Smartphone,
  TrendingDown,
  Clock,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1a4731] rounded-lg flex items-center justify-center">
              <ScanLine className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FreshTrack</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">
              Connexion
            </Link>
            <Link href="/register">
              <Button size="sm">Essai gratuit 14 jours</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-[#1a4731] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <CheckCircle2 className="h-4 w-4" />
            14 jours gratuits · Sans carte bancaire
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Fini le gaspillage.
            <br />
            <span className="text-[#1a4731]">Gérez vos stocks</span>
            <br />
            comme un pro.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            FreshTrack scanne vos factures, gère votre stock automatiquement et vous alerte avant
            qu'un produit expire. Spécialement conçu pour les restaurants indépendants français.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="xl" className="w-full sm:w-auto gap-2">
                Commencer gratuitement
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works" className="text-[#1a4731] font-medium hover:underline flex items-center gap-1">
              Comment ça marche ?
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-1 font-medium text-gray-900">4.9/5</span>
            </div>
            <span>·</span>
            <span>+200 restaurants utilisateurs</span>
            <span>·</span>
            <span>HACCP conforme</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-600">3 étapes simples pour ne plus jamais gaspiller</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: ScanLine,
                title: 'Scannez la facture',
                description:
                  "Prenez en photo votre bon de livraison avec votre téléphone. Notre IA Claude extrait automatiquement tous les produits, quantités et dates.",
                color: 'bg-green-100 text-[#1a4731]',
              },
              {
                step: '2',
                icon: Package,
                title: 'Stock mis à jour auto',
                description:
                  "Votre stock est mis à jour instantanément. Les dates d'expiration sont calculées automatiquement selon les normes HACCP.",
                color: 'bg-blue-100 text-blue-700',
              },
              {
                step: '3',
                icon: Bell,
                title: 'Alertes J-2',
                description:
                  "Recevez un email ou SMS 2 jours avant qu'un produit expire. Réagissez à temps et éliminez le gaspillage.",
                color: 'bg-orange-100 text-orange-700',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="text-center">
                  <div className="relative inline-flex">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${item.color} mb-4`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#1a4731] text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-[#1a4731]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Économisez jusqu'à <span className="text-green-300">5 000€/an</span>
            </h2>
            <p className="text-white/70 text-lg">
              Les restaurants français perdent en moyenne 15% de leur CA en gaspillage alimentaire.
              FreshTrack vous aide à réduire ce chiffre drastiquement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: TrendingDown,
                value: '-80%',
                label: 'de pertes alimentaires',
                sublabel: 'vs sans outil de gestion',
              },
              {
                icon: Clock,
                value: '2h',
                label: 'économisées/semaine',
                sublabel: 'sur la gestion des stocks',
              },
              {
                icon: Shield,
                value: '100%',
                label: 'conforme HACCP',
                sublabel: 'traçabilité garantie',
              },
              {
                icon: Smartphone,
                value: '3min',
                label: 'pour scanner une facture',
                sublabel: "avec notre IA en temps réel",
              },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center p-6 bg-white/10 rounded-2xl">
                  <Icon className="h-8 w-8 text-green-300 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-white font-medium mt-1">{stat.label}</p>
                  <p className="text-white/60 text-sm mt-0.5">{stat.sublabel}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tarifs simples et transparents
            </h2>
            <p className="text-lg text-gray-600">14 jours gratuits sur tous les plans. Sans engagement.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: '29',
                period: '/mois',
                description: 'Pour les petits restaurants',
                features: [
                  '1 restaurant',
                  '50 scans IA/mois',
                  'Alertes email',
                  'Gestion du stock',
                  'Support email',
                ],
                cta: 'Commencer',
                recommended: false,
                priceId: 'starter',
              },
              {
                name: 'Pro',
                price: '49',
                period: '/mois',
                description: 'Le plus populaire',
                features: [
                  '1 restaurant',
                  'Scans IA illimités',
                  'Alertes email + SMS',
                  'Dashboard analytique',
                  'Support prioritaire',
                ],
                cta: 'Commencer',
                recommended: true,
                priceId: 'pro',
              },
              {
                name: 'Multi',
                price: '99',
                period: '/mois',
                description: 'Pour les groupes',
                features: [
                  "Jusqu'à 5 restaurants",
                  'Scans IA illimités',
                  'Alertes email + SMS',
                  'Dashboard multi-sites',
                  'Support dédié',
                ],
                cta: 'Commencer',
                recommended: false,
                priceId: 'multi',
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.recommended
                    ? 'bg-[#1a4731] text-white ring-4 ring-[#1a4731]/20 scale-105'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.recommended && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-400 text-[#1a4731] text-xs font-bold px-4 py-1 rounded-full">
                    RECOMMANDÉ
                  </span>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.recommended ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.recommended ? 'text-white/70' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.recommended ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}€
                  </span>
                  <span className={plan.recommended ? 'text-white/70' : 'text-gray-500'}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${plan.recommended ? 'text-green-300' : 'text-[#1a4731]'}`} />
                      <span className={plan.recommended ? 'text-white/90' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <button
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                      plan.recommended
                        ? 'bg-white text-[#1a4731] hover:bg-green-50'
                        : 'bg-[#1a4731] text-white hover:bg-[#1a4731]/90'
                    }`}
                  >
                    {plan.cta} — 14 jours gratuits
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            Toutes les offres incluent 14 jours d'essai gratuit. Annulation possible à tout moment.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-green-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Prêt à en finir avec le gaspillage ?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Rejoignez plus de 200 restaurants qui font confiance à FreshTrack. Démarrez votre essai
            gratuit aujourd'hui, sans carte bancaire.
          </p>
          <Link href="/register">
            <Button size="xl" className="gap-2">
              Essayer gratuitement 14 jours
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#1a4731] rounded-lg flex items-center justify-center">
                  <ScanLine className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">FreshTrack</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                La solution de gestion des stocks pensée pour les restaurants indépendants français.
                Scannez, gérez, alertez — automatiquement.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#how-it-works" className="hover:text-white">Comment ça marche</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Tarifs</Link></li>
                <li><Link href="/register" className="hover:text-white">Essai gratuit</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/legal/cgu" className="hover:text-white">CGU</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white">Confidentialité</Link></li>
                <li><Link href="/legal/mentions" className="hover:text-white">Mentions légales</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
            <p>© 2025 FreshTrack. Tous droits réservés.</p>
            <p>Fait avec ❤️ pour les restaurateurs français</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
