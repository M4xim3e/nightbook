export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Acces suspendu
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Votre acces NightBook a ete suspendu definitivement. Contactez-nous a contact@nightbook.fr pour plus d informations.
        </p>
      </div>
    </div>
  )
}
