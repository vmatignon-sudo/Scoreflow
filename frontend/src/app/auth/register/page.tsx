'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) { setError(err.message); setLoading(false); return; }
    if (data.user) router.push('/onboarding');
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-[#f5f5f7] rounded-[12px] text-[14px] text-[#1d1d1f] placeholder:text-[#a1a1a6] outline-none focus:ring-2 focus:ring-black/10 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] px-5">
      <div className="bg-white p-7 sm:p-8 rounded-[20px] shadow-lg max-w-[360px] w-full">
        <div className="text-center mb-6">
          <p className="font-semibold text-[#1d1d1f] text-[14px] tracking-tight mb-1">ScoreFlow</p>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f] tracking-tight">Créer un compte</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-2.5">
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Nom complet" className={inputClass} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email professionnel" className={inputClass} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Mot de passe (8 car. min.)" className={inputClass} />
          {error && <p className="text-[12px] text-[#c4342d] bg-[#c4342d]/[0.05] px-3 py-2 rounded-[10px]">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#1e40af] text-white py-2.5 rounded-[12px] text-[14px] font-medium hover:bg-[#1e3a8a] active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-[12px] text-[#6e6e73] mt-5">
          Déjà un compte ? <Link href="/auth/login" className="text-[#1d1d1f] font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
