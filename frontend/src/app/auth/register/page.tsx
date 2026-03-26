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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) router.push('/onboarding');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full animate-scale-in">
        <div className="text-center mb-7">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0071e3] to-[#40a9ff] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-white font-semibold text-[12px]">SF</span>
          </div>
          <h1 className="text-[20px] font-semibold text-[#1d1d1f] tracking-tight">Créer un compte</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Nom complet"
            className="w-full px-3.5 py-2.5 bg-black/[0.03] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition-all"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email professionnel"
            className="w-full px-3.5 py-2.5 bg-black/[0.03] rounded-xl text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:ring-2 focus:ring-[#0071e3]/30 transition-all"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Mot de passe (8 caractères min.)"
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
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-[12px] text-[#86868b] mt-5">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-[#0071e3] font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
