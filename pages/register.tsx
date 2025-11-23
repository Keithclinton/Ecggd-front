import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import api from '../lib/api'
import { useAuth } from '../components/AuthProvider'

export default function Register() {
  const router = useRouter()
  const auth = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/auth/register/', {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone
      })
      // Auto-login then take student to Profile Setup as per workflow
      await auth.login(username, password)
      setSuccess('Registration successful! Redirecting to profile setup...')
      setTimeout(() => router.push('/profile'), 800)
    } catch (err: any) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : (err.message || 'Registration failed');
      setError(msg);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-brand-primary mb-6 text-center">Create Your Account</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          {error && <div className="text-red-600 text-center font-medium py-2 bg-red-50 rounded">{String(error)}</div>}
          {success && <div className="text-green-600 text-center font-medium py-2 bg-green-50 rounded">{success}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Choose a username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Your email address" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="First name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Last name" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Phone number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Create a password" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 rounded bg-brand-primary text-white font-semibold text-lg transition hover:bg-brand-primary/90 disabled:opacity-60">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-brand-primary hover:underline font-medium">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  )
}
