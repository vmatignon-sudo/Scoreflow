'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function SettingsPage() {
  const [weights, setWeights] = useState({
    macro_sectoriel: 20,
    financier: 30,
    materiel: 30,
    dirigeant: 20,
  });

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  function updateWeight(key: keyof typeof weights, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Sidebar />
      <MobileNav />
      <main className="sm:ml-[56px] p-5 sm:p-8 pb-[80px] sm:pb-8">
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-8">Paramètres</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Pondération */}
          <div className="bg-white rounded-[20px] shadow p-6">
            <h2 className="text-lg font-semibold text-[#2d2d2d] mb-4">
              Pondération du scoring
            </h2>
            <p className="text-sm text-[#6e6e73] mb-6">
              Ajustez l&apos;importance relative de chaque dimension.
              Le total doit faire 100%.
            </p>

            <div className="space-y-4">
              {[
                { key: 'macro_sectoriel' as const, label: 'Macro + Sectoriel' },
                { key: 'financier' as const, label: 'Financier' },
                { key: 'materiel' as const, label: 'Matériel' },
                { key: 'dirigeant' as const, label: 'Dirigeant' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#1d1d1f] font-medium">{label}</span>
                    <span className="font-mono text-[#6e6e73]">{weights[key]}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={weights[key]}
                    onChange={(e) => updateWeight(key, parseInt(e.target.value))}
                    className="w-full accent-[#1B4FD8]"
                  />
                </div>
              ))}

              <div
                className={`text-sm font-medium p-2 rounded-lg text-center ${
                  total === 100
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                Total : {total}% {total !== 100 && '(doit être 100%)'}
              </div>
            </div>
          </div>

          {/* Seuils */}
          <div className="bg-white rounded-[20px] shadow p-6">
            <h2 className="text-lg font-semibold text-[#2d2d2d] mb-4">Seuils de verdict</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#424245] mb-1">
                  Seuil GO (score minimum)
                </label>
                <input
                  type="number"
                  defaultValue={14}
                  min={0}
                  max={20}
                  className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#424245] mb-1">
                  Seuil GO Conditionnel
                </label>
                <input
                  type="number"
                  defaultValue={10}
                  min={0}
                  max={20}
                  className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#424245] mb-1">
                  Seuil changement dirigeant (jours)
                </label>
                <input
                  type="number"
                  defaultValue={180}
                  className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#424245] mb-1">
                  Nb liquidations pour VETO
                </label>
                <input
                  type="number"
                  defaultValue={2}
                  min={1}
                  className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
