import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Nav — white, clean */}
      <nav className="sticky top-0 z-50 bg-white/80 glass border-b border-black/[0.04]">
        <div className="max-w-[980px] mx-auto flex items-center justify-between px-5 h-11">
          <Link href="/" className="font-semibold text-[#1d1d1f] text-[14px] tracking-tight">
            ScoreFlow
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/auth/login" className="text-[12px] text-[#424245] hover:text-[#1d1d1f] transition-colors">
              Se connecter
            </Link>
            <Link href="/auth/register"
              className="text-[12px] bg-[#1d1d1f] text-white px-4 py-1.5 rounded-full hover:bg-black active:scale-[0.97] transition-all">
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — dark section */}
      <section className="bg-[#1d1d1f] text-white">
        <div className="max-w-[680px] mx-auto px-5 pt-24 sm:pt-36 pb-20 sm:pb-28 text-center">
          <h1 className="text-[40px] sm:text-[64px] font-semibold leading-[1.03] tracking-tight mb-2">
            ScoreFlow
          </h1>
          <h2 className="text-[24px] sm:text-[28px] font-normal text-white/60 leading-tight tracking-tight mb-6">
            Le scoring de deals de financement.
          </h2>
          <p className="text-[17px] sm:text-[21px] text-white/50 max-w-[460px] mx-auto leading-[1.4] mb-10">
            5 dimensions. 5 minutes. Un verdict clair.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register"
              className="bg-white text-[#1d1d1f] px-7 py-2.5 rounded-full text-[15px] font-medium hover:bg-white/90 active:scale-[0.97] transition-all">
              Démarrer gratuitement
            </Link>
            <Link href="#features"
              className="text-[15px] text-white/70 hover:text-white transition-colors flex items-center gap-1">
              En savoir plus
              <svg className="w-3 h-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Value prop — white section, big text */}
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-[980px] mx-auto px-5 text-center">
          <p className="text-[28px] sm:text-[40px] font-semibold text-[#1d1d1f] leading-[1.1] tracking-tight max-w-[700px] mx-auto">
            ScoreFlow note le deal, pas le client.
            <span className="text-[#6e6e73]"> Un client fragile avec un bien qui s&apos;apprécie peut être un excellent deal.</span>
          </p>
        </div>
      </section>

      {/* Features — gray section, white cards */}
      <section id="features" className="bg-[#f5f5f7] py-16 sm:py-24">
        <div className="max-w-[980px] mx-auto px-5">
          <h2 className="text-[14px] text-[#6e6e73] font-semibold uppercase tracking-wide text-center mb-3">
            Fonctionnalités
          </h2>
          <p className="text-[32px] sm:text-[40px] font-semibold text-[#1d1d1f] tracking-tight text-center mb-12 sm:mb-16 leading-tight">
            Tout ce qu&apos;il faut pour décider.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: '5 dimensions', desc: 'Macro-sectoriel, financier, matériel, dirigeant, inscriptions. Score composite /20 avec pondérations configurables.' },
              { title: 'Simulateur d\'incident', desc: 'Déplacez un curseur pour simuler un impayé. Visualisez l\'impact sur votre exposition en temps réel.' },
              { title: 'APIs publiques FR', desc: 'SIREN, INPI, ratios sectoriels INSEE, indicateurs macro. Enrichissement automatique dès la saisie.' },
              { title: 'Deal Optimizer', desc: 'Des suggestions concrètes pour transformer un GO conditionnel en GO. Par ordre d\'effort minimal.' },
              { title: 'Courbe RRN', desc: 'Le mois exact à partir duquel vous ne pouvez plus perdre d\'argent sur le deal. Visualisé.' },
              { title: 'Multi-tenant', desc: 'Row Level Security, rôles admin/analyst/viewer, profils de scoring par organisation.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-[20px] p-7 shadow hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <h3 className="font-semibold text-[#1d1d1f] text-[17px] mb-2 tracking-tight">{f.title}</h3>
                <p className="text-[14px] text-[#6e6e73] leading-[1.5]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — white section */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-[980px] mx-auto px-5">
          <h2 className="text-[14px] text-[#6e6e73] font-semibold uppercase tracking-wide text-center mb-3">
            Comment ça marche
          </h2>
          <p className="text-[32px] sm:text-[40px] font-semibold text-[#1d1d1f] tracking-tight text-center mb-12 sm:mb-16 leading-tight">
            4 étapes, 5 minutes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { step: '01', title: 'SIREN', desc: 'Entrez un SIREN. On récupère tout automatiquement.' },
              { step: '02', title: 'Le deal', desc: 'Montant, durée, bien financé. Devis extrait par IA.' },
              { step: '03', title: 'Documents', desc: 'Déposez la liasse. Import INPI automatique si disponible.' },
              { step: '04', title: 'Verdict', desc: 'GO, GO conditionnel, ou NO GO. Score détaillé /20.' },
            ].map((s) => (
              <div key={s.step} className="text-center sm:text-left">
                <div className="text-[48px] font-semibold text-[#f5f5f7] leading-none mb-3">{s.step}</div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-1 tracking-tight">{s.title}</h3>
                <p className="text-[14px] text-[#6e6e73] leading-[1.5]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — dark section */}
      <section className="bg-[#1d1d1f] py-20 sm:py-28 text-center">
        <div className="max-w-[500px] mx-auto px-5">
          <h2 className="text-[32px] sm:text-[44px] font-semibold text-white tracking-tight mb-3 leading-tight">
            Prêt à scorer ?
          </h2>
          <p className="text-[17px] text-white/50 mb-8">
            Créez votre premier dossier gratuitement.
          </p>
          <Link href="/auth/register"
            className="inline-block bg-white text-[#1d1d1f] px-7 py-2.5 rounded-full text-[15px] font-medium hover:bg-white/90 active:scale-[0.97] transition-all">
            Commencer
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-5 px-5">
        <div className="max-w-[980px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6e6e73]">
          <span>ScoreFlow</span>
          <span>Art. 6.1.f RGPD — Prévention du risque de crédit</span>
        </div>
      </footer>
    </div>
  );
}
