import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Support both GET (for browser) and POST
export async function GET() {
  return seed();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: Request) {
  return seed();
}

async function seed() {
  // Use service role if available, otherwise anon
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, serviceKey || supabaseAnonKey);

  // Find the Terrassement deal
  const { data: deals } = await supabase
    .from('deals')
    .select('id, siren, raison_sociale')
    .or('siren.eq.123456789,raison_sociale.ilike.%terrassement%')
    .limit(1);

  if (!deals || deals.length === 0) {
    return NextResponse.json({ error: 'Deal Terrassement not found' }, { status: 404 });
  }

  const dealId = deals[0].id;

  // Check existing years
  const { data: existing } = await supabase
    .from('deal_financial_ratios')
    .select('annee')
    .eq('deal_id', dealId);

  const existingYears = (existing || []).map(r => r.annee);

  const inserted: number[] = [];

  // Year 2022 — post-COVID, tighter margins
  if (!existingYears.includes(2022)) {
    const { error } = await supabase.from('deal_financial_ratios').insert({
      deal_id: dealId,
      annee: 2022,
      ca: 1850000, ebitda: 148000, ebit: 92500, resultat_net: 37000, caf: 74000,
      actif_total: 1200000, actif_circulant: 520000, stocks: 85000, creances_clients: 210000,
      passif_total: 1200000, passif_circulant: 480000, dettes_financieres: 380000, fonds_propres: 320000,
      capitaux_permanents: 720000, tresorerie: 45000, charges_personnel: 680000, valeur_ajoutee: 740000, frais_financiers: 28500,
      ratios: {
        liquidite_generale: 1.08, liquidite_reduite: 0.91, liquidite_immediate: 0.09,
        bfr: 185000, frng: 240000, tresorerie_nette: 45000, jours_tresorerie: 9,
        caf: 74000, dette_sur_caf: 5.14, dscr: 0.95, couverture_ff: 3.24,
        autonomie_financiere: 0.27, endettement: 1.19, gearing: 1.19, levier: 2.75,
        marge_ebitda: 0.080, marge_ebit: 0.050, marge_nette: 0.020,
        roe: 0.116, roa: 0.031, roce: 0.077,
        dso: 72, dpo: 58, ccc: 31, rotation_actif: 1.54,
      },
      score_altman_z: 1.85, altman_zone: 'gris',
      score_conan_holder: 0.052, conan_zone: 'attention',
    });
    if (!error) inserted.push(2022);
  }

  // Year 2023 — recovery, improving ratios
  if (!existingYears.includes(2023)) {
    const { error } = await supabase.from('deal_financial_ratios').insert({
      deal_id: dealId,
      annee: 2023,
      ca: 2150000, ebitda: 204250, ebit: 139750, resultat_net: 75250, caf: 118250,
      actif_total: 1350000, actif_circulant: 580000, stocks: 78000, creances_clients: 230000,
      passif_total: 1350000, passif_circulant: 460000, dettes_financieres: 340000, fonds_propres: 420000,
      capitaux_permanents: 890000, tresorerie: 82000, charges_personnel: 740000, valeur_ajoutee: 860000, frais_financiers: 25600,
      ratios: {
        liquidite_generale: 1.26, liquidite_reduite: 1.09, liquidite_immediate: 0.18,
        bfr: 158000, frng: 430000, tresorerie_nette: 82000, jours_tresorerie: 14,
        caf: 118250, dette_sur_caf: 2.87, dscr: 1.18, couverture_ff: 5.47,
        autonomie_financiere: 0.31, endettement: 0.81, gearing: 0.81, levier: 2.21,
        marge_ebitda: 0.095, marge_ebit: 0.065, marge_nette: 0.035,
        roe: 0.179, roa: 0.056, roce: 0.105,
        dso: 65, dpo: 55, ccc: 23, rotation_actif: 1.59,
      },
      score_altman_z: 2.42, altman_zone: 'gris',
      score_conan_holder: 0.078, conan_zone: 'attention',
    });
    if (!error) inserted.push(2023);
  }

  return NextResponse.json({
    deal: deals[0].raison_sociale,
    deal_id: dealId,
    existing_years: existingYears,
    inserted_years: inserted,
  });
}
