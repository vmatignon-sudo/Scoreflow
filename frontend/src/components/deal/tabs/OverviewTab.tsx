'use client';

import NegotiationSliders from '@/components/deal/NegotiationSliders';
import type { Deal, DealAsset, DealScore } from '@/types/database';

type Props = { deal: Deal; asset: DealAsset | null; score: DealScore | null };

// Overview tab is no longer used — all content moved to dedicated tabs
// and score info is solely in the BottomBar.
// This file is kept for backward compatibility but the tab was removed.

export default function OverviewTab({ deal, score }: Props) {
  return (
    <div className="space-y-6">
      <NegotiationSliders deal={deal} score={score} />
    </div>
  );
}
