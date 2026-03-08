export default function PausedPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⏸️</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Compte en pause
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Votre acces NightBook est temporairement suspendu. Contactez-nous a contact@nightbook.fr pour reactiver votre acces.
        </p>
      </div>
    </div>
  )
}
