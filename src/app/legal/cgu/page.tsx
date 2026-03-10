import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Conditions Générales d'Utilisation</h1>
        <div className="space-y-6 text-gray-600">
          <p className="text-sm text-gray-500">Dernière mise à jour : 1er janvier 2025</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">1. Objet</h2>
          <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du service FreshTrack, plateforme de gestion des stocks et des dates de péremption destinée aux restaurateurs.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">2. Acceptation des conditions</h2>
          <p>En créant un compte et en utilisant FreshTrack, vous acceptez sans réserve les présentes CGU.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Description du service</h2>
          <p>FreshTrack est un logiciel SaaS qui permet aux restaurateurs de scanner leurs factures, gérer leur inventaire alimentaire et recevoir des alertes avant la péremption de leurs produits.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">4. Abonnement et facturation</h2>
          <p>FreshTrack est disponible via différentes formules d'abonnement mensuel. Un essai gratuit de 14 jours est offert. Après cette période, le paiement est géré via notre prestataire Stripe.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">5. Limitation de responsabilité</h2>
          <p>FreshTrack est un outil d'aide à la gestion. La responsabilité du respect des normes HACCP et des réglementations sanitaires incombe entièrement à l'exploitant.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">6. Contact</h2>
          <p>Pour toute question : support@freshtrack.fr</p>
        </div>
      </div>
    </div>
  )
}
