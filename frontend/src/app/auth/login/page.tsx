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

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  async function handleMagicLink() {
    if (!email) { setError('Entrez votre email'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) setError(error.message);
    else setMagicLinkSent(true);
    setLoading(false);
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center animate-scale-in">
          <div className="w-11 h-11 bg-[#0071e3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight mb-1">Vérifiez votre email</h2>
          <p className="text-[13px] text-[#86868b]">
            Lien de connexion envoyé à <strong className="text-[#1d1d1f]">{email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full animate-scale-in">
        <div className="text-center mb-7">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0071e3] to-[#40a9ff] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-white font-semibold text-[12px]">SF</span>
          </div>
          <h1 className="text-[20px] font-semibold text-[#1d1d1f] tracking-tight">Connexion</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full px-3.5 py-2.5 bg-black/[0.03] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full px-3.5 py-2.5 bg-black/[0.03] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition-all"
          />

          {error && (
            <p className="text-[12px] text-[#ff3b30] bg-[#ff3b30]/[0.06] px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0071e3] text-white py-2.5 rounded-xl text-[14px] font-medium hover:bg-[#0077ED] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <button
          onClick={handleMagicLink}
          disabled={loading}
          className="w-full mt-2 bg-black/[0.03] text-[#1d1d1f] py-2.5 rounded-xl text-[13px] font-medium hover:bg-black/[0.05] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          Recevoir un lien magique
        </button>

        <p className="text-center text-[12px] text-[#86868b] mt-5">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-[#0071e3] font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
