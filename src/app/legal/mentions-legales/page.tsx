export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Mentions légales</h1>
        <p className="text-zinc-500 text-sm mb-10">Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004</p>

        <div className="space-y-8 text-zinc-300">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Éditeur du site</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1 text-sm">
              <p><span className="text-zinc-500">Nom :</span> Maxime ECK</p>
              <p><span className="text-zinc-500">Statut :</span> Auto-entrepreneur (immatriculation en cours)</p>
              <p><span className="text-zinc-500">SIRET :</span> En cours d'immatriculation</p>
              <p><span className="text-zinc-500">Adresse :</span> 244 rue de Nantes</p>
              <p><span className="text-zinc-500">Email :</span> maximeeck14@gmail.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Hébergement</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-1 text-sm">
              <p><span className="text-zinc-500">Hébergeur :</span> Vercel Inc.</p>
              <p><span className="text-zinc-500">Adresse :</span> 340 Pine Street, Suite 701, San Francisco, California 94104, USA</p>
              <p><span className="text-zinc-500">Site :</span> vercel.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Propriété intellectuelle</h2>
            <p className="text-sm leading-relaxed">
              L'ensemble du contenu de ce site (textes, images, logos, code) est la propriété exclusive de NightBook et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, même partielle, est strictement interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Responsabilité</h2>
            <p className="text-sm leading-relaxed">
              NightBook s'efforce d'assurer l'exactitude des informations diffusées sur ce site. Toutefois, NightBook ne peut garantir l'exactitude, la complétude ou l'actualité des informations diffusées. En conséquence, l'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Contact</h2>
            <p className="text-sm">
              Pour toute question, contactez-nous à : <span className="text-purple-400">maximeeck14@gmail.com</span>
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800 flex gap-4 text-sm">
          <a href="/legal/cgv" className="text-zinc-500 hover:text-purple-400 transition">CGV</a>
          <a href="/legal/cgu" className="text-zinc-500 hover:text-purple-400 transition">CGU</a>
          <a href="/legal/confidentialite" className="text-zinc-500 hover:text-purple-400 transition">Confidentialité</a>
        </div>
      </div>
    </div>
  )
}
