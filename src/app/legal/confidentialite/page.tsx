export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Politique de confidentialité</h1>
        <p className="text-zinc-500 text-sm mb-10">Conformément au Règlement Général sur la Protection des Données (RGPD)</p>

        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">1. Responsable du traitement</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1">
              <p><span className="text-zinc-500">Nom :</span> Maxime ECK</p>
              <p><span className="text-zinc-500">SIRET :</span> En cours d'immatriculation</p>
              <p><span className="text-zinc-500">Email :</span> maximeeck14@gmail.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">2. Données collectées</h2>
            <p className="mb-3">NightBook collecte deux types de données :</p>

            <div className="space-y-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-white font-medium mb-2">Données des Établissements (clients SaaS)</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Adresse email et mot de passe</li>
                  <li>Nom de l'établissement, adresse, ville</li>
                  <li>Informations de paiement (gérées exclusivement par Stripe)</li>
                </ul>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-white font-medium mb-2">Données des clients finaux (réservants)</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Prénom et nom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone</li>
                  <li>Nombre de personnes, demandes spéciales</li>
                  <li>Informations de paiement (gérées exclusivement par Stripe)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">3. Finalités du traitement</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gestion des comptes Établissements et des abonnements</li>
              <li>Traitement et confirmation des réservations</li>
              <li>Envoi d'emails transactionnels (confirmation, rappel, annulation)</li>
              <li>Facturation et gestion des paiements</li>
              <li>Amélioration du service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">4. Base légale</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Exécution du contrat</strong> : traitement des réservations et gestion des abonnements</li>
              <li><strong className="text-white">Intérêt légitime</strong> : amélioration du service, sécurité</li>
              <li><strong className="text-white">Obligation légale</strong> : conservation des données de facturation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">5. Durée de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Données de compte : durée de l'abonnement + 3 ans</li>
              <li>Données de réservation : 3 ans à compter de la réservation</li>
              <li>Données de facturation : 10 ans (obligation comptable)</li>
              <li>Réservations supprimées manuellement : 7 jours (corbeille)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">6. Sous-traitants</h2>
            <div className="space-y-2">
              {[
                { name: 'Supabase', role: 'Base de données et authentification', pays: 'UE / USA (DPA signé)' },
                { name: 'Vercel', role: 'Hébergement', pays: 'USA (clauses contractuelles types)' },
                { name: 'Stripe', role: 'Paiement', pays: 'USA (certifié PCI-DSS)' },
                { name: 'Resend', role: 'Envoi d\'emails', pays: 'USA (clauses contractuelles types)' },
              ].map(s => (
                <div key={s.name} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{s.name}</p>
                    <p className="text-zinc-500 text-xs">{s.role}</p>
                  </div>
                  <span className="text-zinc-500 text-xs">{s.pays}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">7. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-white">Droit d'accès</strong> : obtenir une copie de vos données</li>
              <li><strong className="text-white">Droit de rectification</strong> : corriger des données inexactes</li>
              <li><strong className="text-white">Droit à l'effacement</strong> : demander la suppression de vos données</li>
              <li><strong className="text-white">Droit d'opposition</strong> : vous opposer à certains traitements</li>
              <li><strong className="text-white">Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
            </ul>
            <p className="mt-3">
              Pour exercer vos droits, contactez-nous à : <span className="text-purple-400">maximeeck14@gmail.com</span>. Nous nous engageons à répondre dans un délai de 30 jours.
            </p>
            <p className="mt-2">
              Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">CNIL</a>.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">8. Cookies</h2>
            <p>
              NightBook utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session d'authentification). Aucun cookie de tracking ou publicitaire n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">9. Modification de la politique</h2>
            <p>
              Cette politique peut être mise à jour. La date de dernière mise à jour figure en haut de cette page. En cas de modification substantielle, les utilisateurs seront informés par email.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800 flex gap-4 text-sm">
          <a href="/legal/mentions-legales" className="text-zinc-500 hover:text-purple-400 transition">Mentions légales</a>
          <a href="/legal/cgv" className="text-zinc-500 hover:text-purple-400 transition">CGV</a>
          <a href="/legal/cgu" className="text-zinc-500 hover:text-purple-400 transition">CGU</a>
        </div>
      </div>
    </div>
  )
}
