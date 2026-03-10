import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentions légales</h1>
        <div className="space-y-6 text-gray-600">
          <h2 className="text-xl font-semibold text-gray-900">Éditeur du site</h2>
          <p>
            FreshTrack SAS<br />
            Capital social : 10 000€<br />
            RCS Paris<br />
            Adresse : France<br />
            Email : contact@freshtrack.fr
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Directeur de publication</h2>
          <p>Le directeur de publication est le représentant légal de FreshTrack SAS.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Hébergement</h2>
          <p>
            Ce site est hébergé par :<br />
            Vercel Inc.<br />
            340 Pine Street, Suite 701, San Francisco, California 94104, USA
          </p>
          <p>
            Base de données hébergée par :<br />
            Supabase Inc.<br />
            970 Toa Payoh North, Singapore 318992
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Propriété intellectuelle</h2>
          <p>L'ensemble du contenu de ce site (textes, images, code source) est la propriété de FreshTrack SAS et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">Traitement des données personnelles</h2>
          <p>Conformément à la loi Informatique et Libertés du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour l'exercer, contactez : dpo@freshtrack.fr</p>
        </div>
      </div>
    </div>
  )
}
