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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Entrez votre email');
      return;
    }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E2E8F0] max-w-md w-full text-center">
          <div className="w-12 h-12 bg-[#EBF0FF] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#1B4FD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#0F1923] mb-2">Vérifiez votre email</h2>
          <p className="text-[#4A5568]">
            Un lien de connexion a été envoyé à <strong>{email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E2E8F0] max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F1923]">ScoreFlow</h1>
          <p className="text-[#4A5568] mt-1">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#0F1923] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#1B4FD8] focus:border-transparent outline-none text-[#0F1923]"
              placeholder="vous@entreprise.fr"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#0F1923] mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#1B4FD8] focus:border-transparent outline-none text-[#0F1923]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B4FD8] text-white py-2.5 rounded-lg font-medium hover:bg-[#1640B0] transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleMagicLink}
            disabled={loading}
            className="w-full bg-[#EBF0FF] text-[#1B4FD8] py-2.5 rounded-lg font-medium hover:bg-[#D6E0FF] transition-colors disabled:opacity-50"
          >
            Recevoir un lien magique
          </button>
        </div>

        <p className="text-center text-sm text-[#4A5568] mt-6">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-[#1B4FD8] font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
