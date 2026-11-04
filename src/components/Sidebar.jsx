import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ArrowLeftRight, Dumbbell, ShieldCheck, X } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { getNavigation } from './gymNavigation';

function Sidebar({ mobile = false, onClose, onNavigate }) {
  const auth = useAuth();

  const {
    admin,
    gym,
    role,
    isSuperAdmin,
    memberships,
    homePath,
  } = auth;

  const items = getNavigation(auth);
  const brand = isSuperAdmin ? 'Gym Platform' : gym?.name || 'Gym Workspace';

  return (
    <aside
      className={
        mobile
          ? 'flex h-[100dvh] w-72 flex-col bg-[#10161b] text-zinc-100'
          : 'fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#10161b] text-zinc-100 lg:flex'
      }
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
        <Link
          to={homePath}
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3"
        >
          <span className="rounded-xl bg-lime-300 p-2.5 text-zinc-950">
            {isSuperAdmin ? <ShieldCheck size={23} /> : <Dumbbell size={23} />}
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{brand}</p>
            <p className="mt-1 text-[9px] uppercase tracking-widest text-zinc-500">
              {isSuperAdmin ? 'Platform administration' : 'Management studio'}
            </p>
          </div>
        </Link>

        {mobile && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-zinc-400"
            autoFocus
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Main navigation">
        <p className="px-3 pb-3 pt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          {isSuperAdmin ? 'Platform' : 'Workspace'}
        </p>

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  isActive
                    ? 'bg-lime-300 font-bold text-zinc-950'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={19} />
              {item.label}
            </NavLink>
          );
        })}

        {!isSuperAdmin && memberships.length > 1 && (
          <Link
            to="/select-gym"
            onClick={onNavigate}
            className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-3 text-sm text-zinc-300 hover:bg-white/5"
          >
            <ArrowLeftRight size={18} />
            Switch gym
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-3 border-t border-white/10 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300/10 font-bold text-lime-300">
          {admin?.username?.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{admin?.username}</p>
          <p className="mt-1 text-xs capitalize text-zinc-500">
            {isSuperAdmin ? 'Super Admin' : role}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;