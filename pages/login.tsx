import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Spinner from '../components/Spinner';
import { useAuth } from '../components/AuthProvider';

export default function Login() {
  const router = useRouter();
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const nextPath = useMemo(() => {
    if (!router || !router.query) return null;
    const n = router.query.next;
    return typeof n === 'string' ? n : null;
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await auth.login(username, password);
      setSuccess('Login successful');
      router.push(nextPath || '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-brand-primary mb-6 text-center">
          Login to CCGD LMS
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="text-red-600 text-center font-medium py-2 bg-red-50 rounded">
              {String(error)}
            </div>
          )}
          {success && (
            <div className="text-green-600 text-center font-medium py-2 bg-green-50 rounded">
              {success}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Enter your username or email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Enter your password"
            />
          </div>
          <button
            disabled={loading}
            className={`w-full py-2 rounded font-semibold text-lg transition flex items-center justify-center gap-3 ${
              loading
                ? 'bg-brand-primary text-white opacity-60 cursor-not-allowed'
                : 'bg-brand-primary text-white hover:bg-brand-primary/90'
            }`}
            aria-busy={loading}
            aria-disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size={18} className="text-white" />
                <span>Logging in...</span>
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link
            href="/register"
            className="text-brand-primary hover:underline font-medium"
          >
            Don't have an account? Register
          </Link>
        </div>
      </div>
    </div>
  );
}
