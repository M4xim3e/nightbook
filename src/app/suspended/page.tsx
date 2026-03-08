export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Accès suspendu</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Votre accès à NightBook a été suspendu. Contactez-nous pour régulariser votre situation.
        </p>
        
          href="mailto:contact@nightbook.fr"
          className="inline-block mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition text-sm"
        >
          Nous contacter
        </a>
      </div>
    </div>
  )
}
