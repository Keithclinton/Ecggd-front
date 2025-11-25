import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  setSlidingToken as setSlidingTokenLib,
  clearSlidingToken as clearSlidingTokenLib,
  getSlidingToken as getSlidingTokenLib
} from '../lib/auth';

// 🛑 REMOVE FIELDS NOT USED BY THE NEW, ADMIN-MANAGED SYSTEM
type UserProfile = {
  id: number;
  username: string;
  email: string;
  // We only need basic ID/username/email since we can't update anything else
};

type AuthContextType = {
  access: string | null;
  loading: boolean;
  user: UserProfile | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// --- SIMPLIFIED GUARD CONSTANTS ---
// We only protect the content (like /courses) from non-logged-in users
const PROTECTED_PATHS = ['/courses', '/dashboard', '/']; 
// -----------------------

// 🛑 REMOVED: useWorkflowGuard hook (no more Profile/Application checks)

// 🌟 NEW: The single, simplified guard for authentication
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { access, loading } = useAuth();
    const router = useRouter();
    const isProtected = PROTECTED_PATHS.includes(router.pathname);

    // 🛑 If authenticated, but token is present, allow loading to complete.
    // If not authenticated (no access) and trying to hit a protected path, redirect to login.
    useEffect(() => {
        if (!loading && !access && isProtected) {
            router.replace('/login');
        }
    }, [loading, access, isProtected, router]);
    
    // While loading, or if unauthenticated on a protected path, show loading screen
    if (loading || (!access && isProtected)) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return <>{children}</>;
};

// 🛑 REMOVED: ProfileRequiredGuard and RequireApplication components

// --- Auth Provider Component ---

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [access, setAccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // 🛑 REMOVED: useWorkflowGuard integration

  // INITIAL LOAD + REFRESH
  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function loadFromLocal() {
      try {
        const token = getSlidingTokenLib();
        if (token) {
          setAccess(token);

          // 🛑 REMOVED: Fetching /users/me/ is no longer supported from the frontend
          // We will create a dummy user object to satisfy the context type
          // If the token is valid, we assume the user is valid.
           setUser({ id: 1, username: 'student', email: 'user@lms.com' });
        }
      } catch {}
    }

    async function refreshSession() {
      try {
        const resp = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });

        if (resp.status === 401) {
          clearSlidingTokenLib();
          setAccess(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (resp.ok) {
          const data = await resp.json();
          const newAccess = data.access;

          if (newAccess) {
            setAccess(newAccess);
            setSlidingTokenLib(newAccess);

            // 🛑 SIMPLIFIED: Token is present, assume user is valid
             setUser({ id: 1, username: 'student', email: 'user@lms.com' }); 

            // 🛑 REMOVED: Fetching /users/me/ and student-applications/status 
          }
        }
      } catch (err) {
        console.error('Refresh error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadFromLocal();
    refreshSession();

    interval = setInterval(refreshSession, 30 * 60 * 1000);

    const onTokenChange = () => loadFromLocal();
    window.addEventListener('lms:token-changed', onTokenChange);
    window.addEventListener('storage', onTokenChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('lms:token-changed', onTokenChange);
      window.removeEventListener('storage', onTokenChange);
    };
  }, []);

  // LOGIN
  async function login(username: string, password: string) {
    setLoading(true);
    setUser(null);
    setAccess(null);

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        throw new Error(err?.detail || 'Invalid login credentials');
      }

      const data = await resp.json();
      const newAccess = data.access;

      if (!newAccess) throw new Error('Login did not return access token');

      setAccess(newAccess);
      setSlidingTokenLib(newAccess);

      // 🛑 SIMPLIFIED: Token is present, assume user is valid
      setUser({ id: 1, username, email: `${username}@lms.com` });

      // 🛑 REMOVED: Fetch user profile after getting token
    } catch (e: any) {
      setUser(null);
      throw new Error(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}

    setAccess(null);
    setUser(null);
    clearSlidingTokenLib();
  }

  return (
    <AuthContext.Provider value={{ access, loading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};