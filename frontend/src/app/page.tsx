import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/70 glass border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-12">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#0071e3] to-[#40a9ff] rounded-md flex items-center justify-center">
              <span className="text-white font-semibold text-[9px]">SF</span>
            </div>
            <span className="font-semibold text-[#1d1d1f] text-[14px] tracking-tight">ScoreFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-[13px] text-[#1d1d1f] hover:text-[#0071e3] font-medium transition-colors">
              Se connecter
            </Link>
            <Link
              href="/auth/register"
              className="text-[13px] bg-[#0071e3] text-white px-4 py-1.5 rounded-full font-medium hover:bg-[#0077ED] active:scale-[0.97] transition-all"
            >
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 pt-16 sm:pt-28 pb-16 sm:pb-20 text-center">
        <p className="text-[#0071e3] text-[13px] sm:text-[14px] font-medium mb-3 sm:mb-4 tracking-tight">
          Scoring de deals de financement
        </p>
        <h1 className="text-[32px] sm:text-[52px] font-bold text-[#1d1d1f] leading-[1.1] sm:leading-[1.05] tracking-tight mb-4 sm:mb-5">
          Analysez un deal<br />
          en <span className="bg-gradient-to-r from-[#0071e3] to-[#40a9ff] bg-clip-text text-transparent">5 minutes</span>
        </h1>
        <p className="text-[15px] sm:text-[18px] text-[#86868b] max-w-lg mx-auto leading-relaxed mb-8 sm:mb-10 px-2">
          ScoreFlow note le deal, pas le client. Scoring composite sur 5 dimensions
          incluant le bien financé et sa valeur résiduelle.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
          <Link
            href="/auth/register"
            className="bg-[#0071e3] text-white px-7 py-3 rounded-full font-medium text-[15px] hover:bg-[#0077ED] active:scale-[0.97] transition-all shadow-sm"
          >
            Démarrer gratuitement
          </Link>
          <Link
            href="/auth/login"
            className="bg-black/[0.04] text-[#1d1d1f] px-7 py-3 rounded-full font-medium text-[15px] hover:bg-black/[0.06] active:scale-[0.97] transition-all"
          >
            Se connecter
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 pb-20 sm:pb-28">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            { title: '5 dimensions', desc: 'Macro, financier, matériel, dirigeant, inscriptions.' },
            { title: 'Simulateur', desc: 'Impact d\'un incident de paiement en temps réel.' },
            { title: 'APIs publiques', desc: 'SIREN, INPI, ratios sectoriels, macro INSEE.' },
            { title: 'Deal Optimizer', desc: 'Suggestions pour passer de GO COND. à GO.' },
            { title: 'Courbe RRN', desc: 'Le mois exact où vous ne perdez plus d\'argent.' },
            { title: 'Multi-tenant', desc: 'RLS, rôles, profils scoring configurables.' },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow transition-shadow"
            >
              <h3 className="font-semibold text-[#1d1d1f] text-[15px] mb-1.5 tracking-tight">{f.title}</h3>
              <p className="text-[13px] text-[#86868b] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.04] py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-[12px] text-[#86868b]">
          <span>ScoreFlow</span>
          <span>Art. 6.1.f RGPD</span>
        </div>
      </footer>
    </div>
  );
}
