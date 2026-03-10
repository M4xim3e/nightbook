import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Politique de confidentialité</h1>
        <div className="space-y-6 text-gray-600">
          <p className="text-sm text-gray-500">Dernière mise à jour : 1er janvier 2025</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Données collectées</h2>
          <p>FreshTrack collecte les données suivantes :</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Informations d'identification (email, nom du restaurant)</li>
            <li>Données de stock (produits, quantités, dates)</li>
            <li>Images de factures (stockées de manière sécurisée)</li>
            <li>Données de paiement (gérées par Stripe, non stockées par FreshTrack)</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Utilisation des données</h2>
          <p>Vos données sont utilisées exclusivement pour fournir le service FreshTrack. Elles ne sont jamais vendues à des tiers.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Hébergement et sécurité</h2>
          <p>Les données sont hébergées sur Supabase (infrastructure PostgreSQL sécurisée, serveurs européens). Toutes les communications sont chiffrées via HTTPS/TLS.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Vos droits (RGPD)</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants : accès, rectification, suppression, portabilité et limitation du traitement. Pour exercer ces droits, contactez : dpo@freshtrack.fr</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Cookies</h2>
          <p>FreshTrack utilise uniquement des cookies techniques nécessaires au fonctionnement du service (authentification). Aucun cookie publicitaire n'est utilisé.</p>
        </div>
      </div>
    </div>
  )
}
