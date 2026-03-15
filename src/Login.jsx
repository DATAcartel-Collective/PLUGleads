import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { isSupabaseBrowserKeyValid, supabase } from './supabaseClient';

const Login = ({ onAuthenticated, onPreview, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('CLIENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const appRole = data.user?.app_metadata?.app_role || 'CLIENT';
      if (mode === 'ADMIN' && appRole !== 'DATACARTEL_ADMIN') {
        await supabase.auth.signOut();
        throw new Error('This account is not provisioned as a DATAcartel admin.');
      }
      if (mode === 'CLIENT' && appRole === 'DATACARTEL_ADMIN') {
        throw new Error('Use Admin mode for this account.');
      }

      onAuthenticated();
    } catch (signInFailure) {
      setError(signInFailure.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_10%,#2a1554_0%,#140f2b_45%,#05030d_100%)] px-4">
      <form
        onSubmit={handleSignIn}
        className="w-full max-w-md rounded-2xl border border-violet-200/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl"
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-violet-200/30 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-violet-100 transition hover:border-violet-200/60"
          >
            <ArrowLeft size={14} /> Back
          </button>
        ) : null}
        <p className="text-xs font-bold uppercase tracking-widest text-violet-200">Secure Access</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">PLUGleads Contractor Portal</h1>
        <p className="mt-2 text-xs text-slate-200/80">
          Sign in with your Supabase Auth email/password for the live workspace.
        </p>

        {onPreview ? (
          <button
            type="button"
            onClick={onPreview}
            className="mt-4 w-full rounded-xl border border-violet-200/30 bg-violet-200/20 px-4 py-3 text-xs font-black uppercase tracking-wider text-violet-100 transition hover:bg-violet-200/30"
          >
            Open Read-Only Demo (No Login)
          </button>
        ) : null}

        {!isSupabaseBrowserKeyValid ? (
          <p className="mt-3 rounded-lg border border-amber-400/40 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-200">
            Live sign-in is disabled because no public Supabase key is configured. Set
            {' '}
            <code>VITE_SUPABASE_ANON_KEY</code>
            {' '}
            and refresh.
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-violet-200/20 bg-slate-950/50 p-1">
          <button
            type="button"
            onClick={() => setMode('CLIENT')}
            className={`rounded-lg px-3 py-2 text-xs font-black tracking-wide transition ${mode === 'CLIENT' ? 'bg-violet-300 text-slate-900' : 'text-slate-300'
            }`}
          >
            Contractor
          </button>
          <button
            type="button"
            onClick={() => setMode('ADMIN')}
            className={`rounded-lg px-3 py-2 text-xs font-black tracking-wide transition ${mode === 'ADMIN' ? 'bg-violet-300 text-slate-900' : 'text-slate-300'
            }`}
          >
            DATAcartel
          </button>
        </div>

        <label htmlFor="email" className="mt-5 block text-xs font-bold uppercase tracking-widest text-slate-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-lg border border-violet-200/20 bg-slate-950/60 px-3 py-3 text-white outline-none ring-violet-300/50 focus:ring-2"
          required
        />

        <label htmlFor="password" className="mt-4 block text-xs font-bold uppercase tracking-widest text-slate-300">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-lg border border-violet-200/20 bg-slate-950/60 px-3 py-3 text-white outline-none ring-violet-300/50 focus:ring-2"
          required
        />

        {error ? <p className="mt-4 text-sm font-semibold text-red-500">{error}</p> : null}

        <button
          type="submit"
          disabled={loading || !isSupabaseBrowserKeyValid}
          className="mt-6 w-full rounded-xl bg-violet-300 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-900 transition hover:bg-violet-200 disabled:opacity-60"
        >
          {loading ? 'Signing In...' : `Sign In ${mode === 'ADMIN' ? 'Admin' : 'Contractor'}`}
        </button>

      </form>
    </div>
  );
};

export default Login;

