import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1B4FD8] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SF</span>
          </div>
          <span className="font-bold text-[#0F1923] text-lg">ScoreFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm text-[#4A5568] hover:text-[#0F1923] font-medium">
            Se connecter
          </Link>
          <Link
            href="/auth/register"
            className="text-sm bg-[#1B4FD8] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#1640B0] transition-colors"
          >
            Commencer gratuitement
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 py-24 text-center">
        <div className="inline-block px-3 py-1 bg-[#EBF0FF] text-[#1B4FD8] text-sm font-medium rounded-full mb-6">
          Scoring de deals de financement
        </div>
        <h1 className="text-5xl font-bold text-[#0F1923] leading-tight mb-6">
          Analysez un deal complet<br />
          en <span className="text-[#1B4FD8]">5 minutes</span>
        </h1>
        <p className="text-lg text-[#4A5568] max-w-2xl mx-auto mb-10">
          ScoreFlow note le deal, pas le client. Un scoring composite sur 5 dimensions
          qui intègre le bien financé, sa valeur résiduelle et le risque opérationnel.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/register"
            className="bg-[#1B4FD8] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1640B0] transition-colors text-lg"
          >
            Créer un compte
          </Link>
          <Link
            href="/auth/login"
            className="bg-[#F7F8FA] text-[#0F1923] px-6 py-3 rounded-lg font-medium hover:bg-[#EEF0F5] transition-colors text-lg border border-[#E2E8F0]"
          >
            Se connecter
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-3 gap-8">
          <FeatureCard
            title="5 dimensions"
            description="Macro-sectoriel, financier, matériel, dirigeant et inscriptions — un scoring qui couvre tout."
          />
          <FeatureCard
            title="Simulateur de risque"
            description="Simulez un incident de paiement et visualisez l'impact sur votre exposition en temps réel."
          />
          <FeatureCard
            title="APIs publiques FR"
            description="Enrichissement automatique via SIREN, liasses INPI, ratios sectoriels et indicateurs macro."
          />
          <FeatureCard
            title="Deal Optimizer"
            description="Suggestions automatiques pour transformer un GO CONDITIONNEL en GO avec effort minimal."
          />
          <FeatureCard
            title="Courbe RRN"
            description="Visualisez le risque résiduel net et identifiez le mois où vous ne pouvez plus perdre."
          />
          <FeatureCard
            title="Multi-tenant SaaS"
            description="RLS Supabase, rôles admin/analyst/viewer, profils de scoring configurables."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] py-8 px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-[#8A95A3]">
          <span>ScoreFlow — Scoring de deals de financement</span>
          <span>Art. 6.1.f RGPD — Prévention du risque de crédit</span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors">
      <h3 className="font-semibold text-[#0F1923] mb-2">{title}</h3>
      <p className="text-sm text-[#4A5568] leading-relaxed">{description}</p>
    </div>
  );
}
