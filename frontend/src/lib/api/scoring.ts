const SCORING_API_URL = process.env.NEXT_PUBLIC_SCORING_API_URL || '';

export async function triggerScoring(dealId: string, organizationId: string) {
  const res = await fetch(`${SCORING_API_URL}/api/v1/scoring/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deal_id: dealId,
      organization_id: organizationId,
      force_recalculate: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Scoring API error ${res.status}: ${text}`);
  }

  return res.json();
}
