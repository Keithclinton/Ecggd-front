import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  setSlidingToken as setSlidingTokenLib,
  clearSlidingToken as clearSlidingTokenLib,
  getSlidingToken as getSlidingTokenLib
} from '../lib/auth';

type UserProfile = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  education_level?: string;
  profile_picture?: string;
  // 🌟 Status field for the Student Application check
  is_application_submitted?: boolean; 
  // Add index signature to allow property access via string
  [key: string]: any; 
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


// --- Auth Provider Component ---

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [access, setAccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  // INITIAL LOAD + REFRESH
  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function loadFromLocal() {
      try {
        const token = getSlidingTokenLib();
        if (token) {
          setAccess(token);


          const ur = await fetch('/api/proxy/users/me/', {

            headers: { Authorization: `Bearer ${token}` }
          });
          if (ur.ok) setUser(await ur.json());
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

            const ur = await fetch('/api/proxy/users/me/', {
              headers: { Authorization: `Bearer ${newAccess}` }
            });

            if (ur.ok) {
                let userData = await ur.json();
                
                // 🌟 FETCH APPLICATION STATUS
                const appResp = await fetch('/api/proxy/student-applications/status', {
                    headers: { Authorization: `Bearer ${newAccess}` }
                });

                if (appResp.ok) {
                    const appData = await appResp.json();
                    // Assumes a successful response means the application is submitted
                    userData = { ...userData, is_application_submitted: appData.status === 'submitted' || appData.id };
                }
                
                setUser(userData);
            }
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

      // Fetch user profile after getting token
      const ur = await fetch('/api/proxy/users/me/', {
        headers: { Authorization: `Bearer ${newAccess}` }
      });
      if (ur.ok) {
        setUser(await ur.json());
      }
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