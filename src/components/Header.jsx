import React, { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, Menu, Loader2 } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { getPageDetails } from './gymNavigation';

function Header({ onMenuClick, menuButtonRef, sidebarOpen }) {
  const { pathname } = useLocation();
  const { admin, gym, isSuperAdmin, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const lock = useRef(false);

  const page = getPageDetails(pathname);
  const Icon = page.icon;

  async function handleLogout() {
    if (lock.current) return;

    lock.current = true;
    setLoggingOut(true);

    try {
      await logout();
    } catch {
      // AuthContext clears the local session even if the request fails.
    } finally {
      lock.current = false;
      setLoggingOut(false);
    }
  }

  return (
    <header className="mb-7">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            aria-controls="gym-mobile-navigation"
            className="rounded-xl border border-white/10 p-2.5 text-zinc-300 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-200">
              {isSuperAdmin ? 'Platform administration' : gym?.name}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{page.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-zinc-400 sm:block">
            {admin?.username}
          </span>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-xl border border-red-300/15 bg-red-300/5 px-3 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-300/10 disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}

            {loggingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-7">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">
            {isSuperAdmin ? 'Build. Manage. Grow.' : 'Your space. Your pace.'}
          </p>
          <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            {page.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {page.description}
          </p>
        </div>

        <div className="hidden rounded-2xl border border-lime-300/20 bg-lime-300/10 p-4 text-lime-300 sm:block">
          <Icon size={28} />
        </div>
      </div>
    </header>
  );
}

export default Header;