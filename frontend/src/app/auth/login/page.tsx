'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else router.push('/dashboard');
  }

  async function handleMagicLink() {
    if (!email) { setError('Entrez votre email'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setMagicLinkSent(true);
    setLoading(false);
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">
        <div className="bg-white p-8 rounded-[20px] shadow-lg max-w-[360px] w-full text-center">
          <p className="text-[15px] font-medium text-[#424245] mb-1">Vérifiez votre email</p>
          <p className="text-[13px] text-[#6e6e73]">Lien envoyé à <strong className="text-[#1d1d1f]">{email}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] px-5">
      <div className="bg-white p-7 sm:p-8 rounded-[20px] shadow-lg max-w-[360px] w-full">
        <div className="text-center mb-6">
          <p className="font-semibold text-[#1d1d1f] text-[14px] tracking-tight mb-1">ScoreFlow</p>
          <h1 className="text-[22px] font-semibold text-[#1d1d1f] tracking-tight">Connexion</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-2.5">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email"
            className="w-full px-3.5 py-2.5 bg-[#f5f5f7] rounded-[12px] text-[14px] text-[#1d1d1f] placeholder:text-[#a1a1a6] outline-none focus:ring-2 focus:ring-black/10 transition-all" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe"
            className="w-full px-3.5 py-2.5 bg-[#f5f5f7] rounded-[12px] text-[14px] text-[#1d1d1f] placeholder:text-[#a1a1a6] outline-none focus:ring-2 focus:ring-black/10 transition-all" />
          {error && <p className="text-[12px] text-[#c4342d] bg-[#c4342d]/[0.05] px-3 py-2 rounded-[10px]">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#1e40af] text-white py-2.5 rounded-[12px] text-[14px] font-medium hover:bg-[#1e3a8a] active:scale-[0.98] transition-all disabled:opacity-50">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <button onClick={handleMagicLink} disabled={loading}
          className="w-full mt-2 bg-[#f5f5f7] text-[#1d1d1f] py-2.5 rounded-[12px] text-[13px] font-medium hover:bg-[#ededf0] active:scale-[0.98] transition-all disabled:opacity-50">
          Lien magique
        </button>

        <p className="text-center text-[12px] text-[#6e6e73] mt-5">
          Pas de compte ? <Link href="/auth/register" className="text-[#1d1d1f] font-medium hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
