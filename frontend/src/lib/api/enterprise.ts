export async function searchEnterprise(query: string) {
  const isValidSiren = /^\d{9}$/.test(query.replace(/\s/g, ''));
  const params = new URLSearchParams({
    q: query.replace(/\s/g, ''),
    per_page: '5',
  });

  const res = await fetch(
    `https://recherche-entreprises.api.gouv.fr/search?${params}`
  );

  if (!res.ok) throw new Error('Erreur API Recherche Entreprises');
  const data = await res.json();

  return (data.results || []).map((r: any) => {
    const siege = r.siege || {};
    const dirigeants = r.dirigeants || [];
    const dirigeant = dirigeants[0] || {};

    return {
      siren: r.siren,
      raison_sociale: r.nom_complet,
      forme_juridique: r.nature_juridique,
      code_naf: siege.activite_principale,
      secteur_label: siege.libelle_activite_principale,
      adresse: [siege.adresse, siege.code_postal, siege.commune]
        .filter(Boolean)
        .join(' '),
      date_creation_entreprise: r.date_creation,
      dirigeant_nom: dirigeant.nom || '',
      dirigeant_prenom: dirigeant.prenoms || '',
      dirigeant_date_nomination: dirigeant.date_mise_a_jour || null,
      tranche_effectif: r.tranche_effectif_salarie,
      etat_administratif: r.etat_administratif,
    };
  });
}
