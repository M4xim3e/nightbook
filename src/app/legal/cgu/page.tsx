export default function CGUPage() {
  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-zinc-500 text-sm mb-10">En vigueur au 1er mars 2026</p>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 1 — Définitions</h2>
            <ul className="space-y-1">
              <li><strong className="text-white">« NightBook »</strong> : la plateforme SaaS éditée par [NOM PRÉNOM]</li>
              <li><strong className="text-white">« Établissement »</strong> : toute boîte de nuit, club ou bar ayant souscrit un abonnement</li>
              <li><strong className="text-white">« Client final »</strong> : toute personne physique effectuant une réservation via la page publique d'un Établissement</li>
              <li><strong className="text-white">« Service »</strong> : l'ensemble des fonctionnalités de NightBook</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 2 — Accès au service</h2>
            <p>
              L'accès au Service est réservé aux Établissements ayant créé un compte et souscrit un abonnement actif. Le compte est personnel et non cessible. L'Établissement est responsable de la confidentialité de ses identifiants.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 3 — Utilisation du service</h2>
            <p>L'Établissement s'engage à :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Utiliser NightBook uniquement dans le cadre de son activité légale</li>
              <li>Ne pas publier de contenu illicite, trompeur ou portant atteinte aux droits de tiers</li>
              <li>Respecter la vie privée de ses clients finaux et les informer de l'utilisation de leurs données</li>
              <li>Ne pas tenter de perturber le fonctionnement de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 4 — Réservations et paiements clients finaux</h2>
            <p>
              Les réservations effectuées par les clients finaux via la page publique de l'Établissement sont soumises aux conditions définies par l'Établissement lui-même (minimum spending, politique d'annulation, etc.). NightBook agit en tant que prestataire technique et n'est pas partie au contrat entre l'Établissement et son client final.
            </p>
            <p className="mt-2">
              Les acomptes sont collectés via Stripe. L'Établissement reconnaît que NightBook n'est pas responsable des litiges financiers entre l'Établissement et ses clients finaux.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 5 — Disponibilité et maintenance</h2>
            <p>
              NightBook s'efforce d'assurer la continuité du service. Des interruptions ponctuelles peuvent survenir pour maintenance. NightBook ne peut être tenu responsable des interruptions indépendantes de sa volonté (hébergeur, services tiers, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 6 — Suspension et résiliation</h2>
            <p>
              NightBook se réserve le droit de suspendre ou résilier l'accès d'un Établissement en cas de non-paiement, d'utilisation frauduleuse ou de violation des présentes CGU, sans préjudice de tout recours en dommages et intérêts.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 7 — Propriété intellectuelle</h2>
            <p>
              La plateforme NightBook et tous ses composants (code, design, marque) sont la propriété exclusive de NightBook. L'Établissement ne bénéficie que d'un droit d'utilisation limité, non exclusif et non transférable.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 8 — Modification des CGU</h2>
            <p>
              NightBook se réserve le droit de modifier les présentes CGU à tout moment. Les Établissements seront informés par email au moins 15 jours avant l'entrée en vigueur des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Article 9 — Droit applicable</h2>
            <p>
              Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la compétence exclusive des tribunaux de [VILLE].
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800 flex gap-4 text-sm">
          <a href="/legal/mentions-legales" className="text-zinc-500 hover:text-purple-400 transition">Mentions légales</a>
          <a href="/legal/cgv" className="text-zinc-500 hover:text-purple-400 transition">CGV</a>
          <a href="/legal/confidentialite" className="text-zinc-500 hover:text-purple-400 transition">Confidentialité</a>
        </div>
      </div>
    </div>
  )
}
