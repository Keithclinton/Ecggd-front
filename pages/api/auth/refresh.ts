import type { NextApiRequest, NextApiResponse } from 'next'

// POST /api/auth/refresh -> use httpOnly cookie to refresh access via backend /api/token/refresh/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  if (!rawBase) {
    return res.status(500).json({ error: 'Backend URL not configured. Set NEXT_PUBLIC_API_BASE_URL in .env.local' })
  }
  const backendBase = rawBase.replace(/\/$/, '')
  try {
    // read cookie from request headers
    const cookie = req.headers.cookie || ''
    const match = cookie.split(';').map(s => s.trim()).find(s => s.startsWith('ccgd_refresh='))
    const refresh = match ? match.split('=')[1] : null
    if (!refresh) return res.status(401).json({ error: 'No refresh token' })

    async function tryRefresh(url: string) {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
      })
      const d = await r.json().catch(() => ({}))
      return { ok: r.ok, status: r.status, data: d }
    }

    // Try SimpleJWT first
    let result = await tryRefresh(`${backendBase}/api/token/refresh/`)
    if (!result.ok && result.status === 404) {
      // Fallback to custom auth refresh
      result = await tryRefresh(`${backendBase}/api/auth/refresh/`)
    }
    if (!result.ok) return res.status(result.status).json(result.data || { error: 'Refresh failed' })

    const access = result.data?.access || result.data?.access_token || result.data?.token
    return res.status(200).json({ access })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Refresh proxy error' })
  }
}
