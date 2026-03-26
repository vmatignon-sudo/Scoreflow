import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#fbfbfd]/80 glass">
        <div className="max-w-[980px] mx-auto flex items-center justify-between px-5 h-11">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-[#1d1d1f] text-[14px] tracking-tight">ScoreFlow</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/auth/login" className="text-[12px] text-[#1d1d1f] hover:text-[#6e6e73] font-normal transition-colors">
              Se connecter
            </Link>
            <Link
              href="/auth/register"
              className="text-[12px] bg-[#1d1d1f] text-white px-4 py-1.5 rounded-full font-normal hover:bg-[#000] active:scale-[0.97] transition-all"
            >
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-[680px] mx-auto px-5 pt-20 sm:pt-32 pb-16 sm:pb-24 text-center">
        <h1 className="text-[36px] sm:text-[56px] font-semibold text-[#1d1d1f] leading-[1.05] tracking-tight mb-3">
          Scorez vos deals.
        </h1>
        <h2 className="text-[36px] sm:text-[56px] font-semibold text-[#6e6e73] leading-[1.05] tracking-tight mb-6">
          En 5 minutes.
        </h2>
        <p className="text-[17px] sm:text-[21px] text-[#6e6e73] max-w-[500px] mx-auto leading-[1.4] mb-8 sm:mb-10 font-normal">
          Scoring composite sur 5 dimensions. Le bien financé, la valeur résiduelle, le risque. Tout compris.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/auth/register"
            className="bg-[#1d1d1f] text-white px-7 py-2.5 rounded-full text-[15px] font-normal hover:bg-[#000] active:scale-[0.97] transition-all"
          >
            Démarrer gratuitement
          </Link>
          <Link
            href="#features"
            className="text-[#1d1d1f] text-[15px] font-normal hover:text-[#6e6e73] transition-colors flex items-center gap-1"
          >
            En savoir plus
            <svg className="w-3.5 h-3.5 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white py-16 sm:py-24">
        <div className="max-w-[980px] mx-auto px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: '5 dimensions', desc: 'Macro-sectoriel, financier, matériel, dirigeant, inscriptions. Score composite /20.' },
              { title: 'Simulateur', desc: 'Simulez un incident de paiement. Visualisez l\'impact sur votre exposition.' },
              { title: 'APIs publiques', desc: 'SIREN, INPI, ratios sectoriels, indicateurs macro. Enrichissement automatique.' },
              { title: 'Deal Optimizer', desc: 'Suggestions pour transformer un GO conditionnel en GO. Effort minimal.' },
              { title: 'Courbe RRN', desc: 'Le mois exact à partir duquel vous ne pouvez plus perdre d\'argent.' },
              { title: 'Multi-tenant', desc: 'Row Level Security, rôles, profils de scoring configurables par organisation.' },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-[#f5f5f7] rounded-[20px] p-7 sm:p-8 hover:bg-[#ededf0] transition-colors"
              >
                <h3 className="font-semibold text-[#1d1d1f] text-[17px] mb-2 tracking-tight">{f.title}</h3>
                <p className="text-[14px] text-[#6e6e73] leading-[1.5]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 text-center px-5">
        <h2 className="text-[28px] sm:text-[40px] font-semibold text-[#1d1d1f] tracking-tight mb-3">
          Prêt à scorer ?
        </h2>
        <p className="text-[17px] text-[#6e6e73] mb-8">
          Créez votre premier dossier en quelques clics.
        </p>
        <Link
          href="/auth/register"
          className="inline-block bg-[#1d1d1f] text-white px-7 py-2.5 rounded-full text-[15px] font-normal hover:bg-[#000] active:scale-[0.97] transition-all"
        >
          Commencer gratuitement
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.04] py-5 px-5">
        <div className="max-w-[980px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6e6e73]">
          <span>ScoreFlow</span>
          <span>Art. 6.1.f RGPD — Prévention du risque de crédit</span>
        </div>
      </footer>
    </div>
  );
}
