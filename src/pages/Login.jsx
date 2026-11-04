import React, { useRef, useState } from 'react';
import {
  Dumbbell,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import PwaControls from '../components/PwaControls';

import {
  inputClass,
  buttonClass,
  Notice,
  errorMessage,
} from '../components/ui';

function Login() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const lock = useRef(false);

  async function submit(event) {
    event.preventDefault();

    if (lock.current) return;

    lock.current = true;
    setBusy(true);
    setError('');

    try {
      await login({
        username: username.trim(),
        password,
      });
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#0b0e11] p-5 text-zinc-100">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#11171d] shadow-2xl lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-[#182118] p-12 lg:flex">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-lime-300 p-3 text-zinc-950">
              <Dumbbell size={28} />
            </div>
            <span className="text-xl font-extrabold">Gym Platform</span>
          </div>

          <div className="py-20">
            <p className="text-xs font-bold uppercase tracking-widest text-lime-300">
              Built for your next chapter
            </p>

            <h2 className="mt-6 text-5xl font-extrabold leading-tight">
              Stronger gyms.
              <br />
              <span className="text-lime-300">Smarter business.</span>
            </h2>

            <p className="mt-6 text-sm leading-7 text-zinc-400">
              Members, payments and daily operations—organized
              in your own gym workspace.
            </p>
          </div>

          <p className="text-xs text-zinc-500">
            One platform. A dedicated workspace for every gym.
          </p>
        </section>

        <section className="p-7 sm:p-12">
          <ShieldCheck size={34} className="mb-7 text-lime-300" />

          <h1 className="text-3xl font-bold">Welcome back.</h1>
          <p className="mb-7 mt-3 text-sm text-zinc-400">
            Sign in with your platform or gym account.
          </p>

          <Notice>{error}</Notice>

          <form onSubmit={submit} className="mt-5 space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                maxLength={80}
                disabled={busy}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm">
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={visible ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={busy}
                  className={`${inputClass} pr-12`}
                />

                <button
                  type="button"
                  aria-label={visible ? 'Hide password' : 'Show password'}
                  aria-pressed={visible}
                  onClick={() => setVisible((value) => !value)}
                  className="absolute right-3 top-3 text-zinc-400"
                >
                  {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button disabled={busy} className={`${buttonClass} w-full`}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-7">
            <PwaControls />
          </div>

          <p className="mt-7 text-center text-xs leading-6 text-zinc-500">
            Need access? Contact your gym owner or platform administrator.
          </p>
        </section>
      </div>
    </main>
  );
}

export default Login;