import type { NextApiRequest, NextApiResponse } from 'next'

// POST /api/auth/logout -> clear refresh cookie and optionally call backend logout
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const backendBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
  try {
    // attempt to call backend logout (best-effort)
    try {
      await fetch(`${backendBase}/api/auth/logout/`, { method: 'POST' })
    } catch (e) {
      // ignore backend logout errors
    }

    // clear cookie
    res.setHeader('Set-Cookie', `ccgd_refresh=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`)
    return res.status(200).json({ ok: true })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Logout proxy error' })
  }
}
