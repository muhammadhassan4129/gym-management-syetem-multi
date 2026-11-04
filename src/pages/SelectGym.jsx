import React, { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';

import { useAuth, getId, canAccessGym } from '../context/AuthContext';

import {
  panelClass,
  secondaryClass,
  Notice,
  errorMessage,
} from '../components/ui';

function SelectGym() {
  const { memberships, selectGym, logout } = useAuth();

  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function choose(id) {
    if (busyId) return;

    setBusyId(id);
    setError('');

    try {
      await selectGym(id);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyId('');
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] px-5 py-16 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Choose your gym</h1>
            <p className="mt-3 text-sm text-zinc-400">
              Open the workspace you want to manage.
            </p>
          </div>

          <button
            onClick={() => logout().catch(() => {})}
            className={secondaryClass}
          >
            Sign out
          </button>
        </div>

        <Notice>{error}</Notice>

        {!memberships.length && (
          <Notice>
            No gym is assigned to your account. Contact the platform administrator.
          </Notice>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {memberships.map((membership) => {
            const gym = membership.gymId;
            const id = getId(gym);

            if (!id || typeof gym !== 'object') return null;

            return (
              <button
                key={membership._id || id}
                onClick={() => choose(id)}
                disabled={Boolean(busyId)}
                className={`${panelClass} p-6 text-left transition hover:border-lime-300/40 disabled:opacity-50`}
              >
                <Building2 size={28} className="text-lime-300" />
                <h2 className="mt-5 text-lg font-bold">{gym.name}</h2>

                <p className="mt-2 text-xs capitalize text-zinc-400">
                  {membership.role} · {canAccessGym(gym) ? 'Access available' : 'Access restricted'}
                </p>

                <span className="mt-6 flex items-center gap-2 text-sm font-semibold text-lime-300">
                  {busyId === id ? 'Opening...' : 'Open workspace'}
                  <ArrowRight size={16} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default SelectGym;