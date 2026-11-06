import React from 'react';

import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';

import {
  AuthProvider,
  useAuth,
  getId,
} from './context/AuthContext';

import Layout from './components/Layout';

import {
  Loading,
  Notice,
  buttonClass,
  secondaryClass,
} from './components/ui';

import Login from './pages/Login';
import SelectGym from './pages/SelectGym';
import Platform from './pages/Platform';
import GymAccount from './pages/GymAccount';

import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Services from './pages/Services';
import Subscriptions from './pages/Subscriptions';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';

function RequireAuth() {
  const { admin } = useAuth();

  return admin
    ? <Outlet />
    : <Navigate to="/login" replace />;
}

function RequirePlatform() {
  const { isSuperAdmin, homePath } = useAuth();

  return isSuperAdmin
    ? <Outlet />
    : <Navigate to={homePath} replace />;
}

function RequireGym() {
  const { gym, isSuperAdmin } = useAuth();

  if (isSuperAdmin) return <Navigate to="/platform" replace />;
  if (!gym) return <Navigate to="/select-gym" replace />;

  return <Outlet />;
}

function RequireActiveGym() {
  const { gymAllowed } = useAuth();

  return gymAllowed
    ? <Outlet />
    : <Navigate to="/gym/billing" replace />;
}

function RequireRole({ roles }) {
  const { role, homePath } = useAuth();

  return roles.includes(role)
    ? <Outlet />
    : <Navigate to={homePath} replace />;
}

function SessionScreen({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0e11] p-5 text-zinc-100">
      <div className="w-full max-w-lg space-y-5">{children}</div>
    </main>
  );
}

function BillingScreen() {
  const { role } = useAuth();

  if (role !== 'owner') {
    return (
      <Notice>
        Gym access is restricted. Please contact your gym owner.
      </Notice>
    );
  }

  return <GymAccount />;
}

function ApplicationRoutes() {
  const auth = useAuth();

  const {
    admin,
    gym,
    loading,
    error,
    homePath,
    refresh,
    logout,
  } = auth;

  if (loading) {
    return (
      <SessionScreen>
        <Loading text="Verifying your workspace..." />
      </SessionScreen>
    );
  }

  if (error) {
    return (
      <SessionScreen>
        <Notice>{error}</Notice>
        <div className="flex gap-3">
          <button onClick={() => refresh(true)} className={buttonClass}>
            Retry
          </button>
          <button
            onClick={() => logout().catch(() => {})}
            className={secondaryClass}
          >
            Sign out
          </button>
        </div>
      </SessionScreen>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={admin ? <Navigate to={homePath} replace /> : <Login />}
      />

      <Route element={<RequireAuth />}>
        <Route
          path="/select-gym"
          element={
            auth.isSuperAdmin
              ? <Navigate to="/platform" replace />
              : <SelectGym />
          }
        />

        <Route element={<RequirePlatform />}>
          <Route element={<Layout key="platform" />}>
            <Route path="/platform" element={<Platform />} />
            <Route path="/platform/gyms" element={<Platform />} />
            <Route path="/platform/plans" element={<Platform />} />
            <Route path="/platform/billing" element={<Platform />} />
          </Route>
        </Route>

        <Route element={<RequireGym />}>
          <Route element={<Layout key={`gym-${getId(gym)}`} />}>
            <Route path="/gym/billing" element={<BillingScreen />} />

            <Route element={<RequireActiveGym />}>
              <Route path="/members" element={<Members />} />
              <Route path="/payments" element={<Payments />} />

              <Route element={<RequireRole roles={['owner', 'manager']} />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/services" element={<Services />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/reports" element={<Reports />} />
              </Route>

              <Route element={<RequireRole roles={['owner']} />}>
                <Route
                  path="/gym/settings"
                  element={<GymAccount key="settings" />}
                />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ApplicationRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;