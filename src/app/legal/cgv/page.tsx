export default function CGVPage() {
  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales de Vente</h1>
        <p className="text-zinc-500 text-sm mb-10">En vigueur au 1er mars 2026</p>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 1 — Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre NightBook ([NOM PRÉNOM], [SIRET]) et tout établissement (ci-après « le Client ») souscrivant à l'abonnement NightBook, plateforme SaaS de gestion des réservations VIP.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 2 — Services proposés</h2>
            <p>NightBook propose un abonnement mensuel donnant accès à :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Une page de réservation publique personnalisée</li>
              <li>Un système de paiement d'acompte intégré via Stripe</li>
              <li>L'envoi automatique d'emails de confirmation</li>
              <li>La gestion de liste d'attente</li>
              <li>Un tableau de bord de gestion en temps réel</li>
              <li>L'envoi de rappels automatiques J-1</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 3 — Tarifs et facturation</h2>
            <p>
              L'abonnement est proposé au tarif de <strong className="text-white">79€ HT par mois</strong>, sans engagement. Une période d'essai gratuite de 14 jours est offerte à tout nouveau Client. Aucun prélèvement n'est effectué pendant la période d'essai.
            </p>
            <p className="mt-2">
              Le prélèvement est effectué mensuellement via la plateforme de paiement Stripe. Une facture est émise et transmise au Client pour chaque prélèvement.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 4 — Résiliation</h2>
            <p>
              Le Client peut résilier son abonnement à tout moment depuis son espace Stripe (portail client) ou en contactant NightBook par email. La résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement au prorata n'est effectué.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 5 — Obligations du Client</h2>
            <p>Le Client s'engage à :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Fournir des informations exactes lors de son inscription</li>
              <li>Utiliser la plateforme conformément à sa destination et aux lois en vigueur</li>
              <li>Ne pas tenter de contourner les systèmes de sécurité</li>
              <li>Informer NightBook de tout incident dans les plus brefs délais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 6 — Responsabilité</h2>
            <p>
              NightBook s'engage à assurer la disponibilité du service avec un objectif de disponibilité de 99% (hors maintenance). NightBook ne saurait être tenu responsable des dommages indirects liés à une interruption de service, ni des litiges entre le Client et ses propres clients finaux (réservants).
            </p>
            <p className="mt-2">
              Les paiements d'acomptes effectués par les clients finaux transitent via Stripe. NightBook n'est pas responsable des dysfonctionnements liés à Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 7 — Données personnelles</h2>
            <p>
              NightBook traite les données personnelles dans le respect du RGPD. Voir notre <a href="/legal/confidentialite" className="text-purple-400 hover:text-purple-300">Politique de confidentialité</a>.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 8 — Droit applicable</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français seront compétents.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 9 — Contact</h2>
            <p>
              Pour toute question relative aux présentes CGV : <span className="text-purple-400">[EMAIL DE CONTACT]</span>
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800 flex gap-4 text-sm">
          <a href="/legal/mentions-legales" className="text-zinc-500 hover:text-purple-400 transition">Mentions légales</a>
          <a href="/legal/cgu" className="text-zinc-500 hover:text-purple-400 transition">CGU</a>
          <a href="/legal/confidentialite" className="text-zinc-500 hover:text-purple-400 transition">Confidentialité</a>
        </div>
      </div>
    </div>
  )
}
