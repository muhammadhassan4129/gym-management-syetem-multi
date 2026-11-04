import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from './Sidebar';
import Header from './Header';
import PwaControls from './PwaControls';

function Layout() {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const dialogRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (sidebarOpen && !dialog.open) dialog.showModal();
    if (!sidebarOpen && dialog.open) dialog.close();

    if (!sidebarOpen) return undefined;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');

    const onChange = (event) => {
      if (event.matches) setSidebarOpen(false);
    };

    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-zinc-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-lime-300 focus:p-3 focus:text-black"
      >
        Skip to content
      </a>

      <Sidebar />

      <dialog
        ref={dialogRef}
        id="gym-mobile-navigation"
        aria-label="Mobile navigation"
        className="fixed inset-y-0 left-0 m-0 h-[100dvh] max-h-none w-72 max-w-[85vw] border-0 bg-transparent p-0 backdrop:bg-black/70"
        onCancel={(event) => {
          event.preventDefault();
          setSidebarOpen(false);
        }}
        onClose={() => {
          setSidebarOpen(false);

          if (!window.matchMedia('(min-width: 1024px)').matches) {
            menuButtonRef.current?.focus();
          }
        }}
      >
        <Sidebar
          mobile
          onClose={() => setSidebarOpen(false)}
          onNavigate={() => setSidebarOpen(false)}
        />
      </dialog>

      <div className="lg:pl-64">
        <div className="mx-auto max-w-[1600px] px-4 pb-8 pt-[env(safe-area-inset-top)] sm:px-6 lg:px-8">
          <Header
            menuButtonRef={menuButtonRef}
            sidebarOpen={sidebarOpen}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main
            id="main-content"
            tabIndex={-1}
            className="min-w-0 space-y-5 outline-none"
          >
            <PwaControls />
            <Outlet />
          </main>

          <footer className="mt-10 border-t border-white/10 pb-[env(safe-area-inset-bottom)] pt-5 text-xs text-zinc-600">
            Your gym. Your people. Your progress.
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Layout;