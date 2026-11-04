import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { TOKEN_KEY } from '../api';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;

  return String(value._id || value.id || '');
};

export function canAccessGym(gym) {
  return Boolean(
    gym &&
      gym.status === 'active' &&
      (
        gym.lifetimeAccess ||
        new Date(gym.accessUntil).getTime() > Date.now()
      )
  );
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const requestVersion = useRef(0);

  const clearSession = useCallback(() => {
    requestVersion.current += 1;
    localStorage.removeItem(TOKEN_KEY);

    setSession(null);
    setError('');
    setLoading(false);
  }, []);

  const refresh = useCallback(async (blocking = false) => {
    const version = ++requestVersion.current;

    if (!localStorage.getItem(TOKEN_KEY)) {
      setSession(null);
      setError('');
      setLoading(false);
      return;
    }

    if (blocking) setLoading(true);

    setError('');

    try {
      const data = await authService.me();

      if (version === requestVersion.current) {
        setSession(data);
      }
    } catch (requestError) {
      if (version !== requestVersion.current) return;

      if (!localStorage.getItem(TOKEN_KEY)) {
        setSession(null);
      } else {
        setError(
          requestError.response?.data?.message ||
          'Unable to verify your session. Please retry.'
        );
      }
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh(true);

    const onExpired = () => clearSession();
    const onRefresh = () => refresh(false);

    const onStorage = (event) => {
      if (event.key === TOKEN_KEY || event.key === null) {
        setSession(null);
        refresh(true);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh(false);
      }
    };

    window.addEventListener('gym:session-expired', onExpired);
    window.addEventListener('gym:refresh-session', onRefresh);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      requestVersion.current += 1;

      window.removeEventListener('gym:session-expired', onExpired);
      window.removeEventListener('gym:refresh-session', onRefresh);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh, clearSession]);

  async function login(credentials) {
    const result = await authService.login(credentials);

    localStorage.setItem(TOKEN_KEY, result.token);
    setSession(null);

    await refresh(true);
  }

  async function selectGym(gymId) {
    const result = await authService.selectGym(gymId);

    // Clear the old workspace before loading the selected one.
    setLoading(true);
    setSession(null);
    localStorage.setItem(TOKEN_KEY, result.token);

    await refresh(true);
  }

  async function logout() {
    try {
      if (localStorage.getItem(TOKEN_KEY)) {
        await authService.logout();
      }
    } finally {
      clearSession();
    }
  }

  const admin = session?.admin || null;
  const memberships = session?.memberships || [];

  const membership = memberships.find(
    (item) => getId(item.gymId) === getId(session?.selectedGymId)
  );

  const gym =
    membership?.gymId &&
    typeof membership.gymId === 'object'
      ? membership.gymId
      : null;

  const isSuperAdmin = admin?.platformRole === 'super_admin';
  const role = membership?.role || null;
  const gymAllowed = canAccessGym(gym);

  let homePath = '/login';

  if (admin) {
    if (isSuperAdmin) {
      homePath = '/platform';
    } else if (!gym) {
      homePath = '/select-gym';
    } else if (!gymAllowed) {
      homePath = '/gym/billing';
    } else {
      homePath = role === 'receptionist' ? '/members' : '/';
    }
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        memberships,
        membership,
        gym,
        role,
        isSuperAdmin,
        gymAllowed,
        homePath,
        loading,
        error,
        login,
        logout,
        selectGym,
        refresh,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be inside AuthProvider.');
  }

  return context;
}