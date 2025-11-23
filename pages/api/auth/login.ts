import type { NextApiRequest, NextApiResponse } from 'next'

// POST /api/auth/login -> proxy to backend /api/token/ to get JWT
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  if (!rawBase) {
    return res.status(500).json({ error: 'Backend URL not configured. Set NEXT_PUBLIC_API_BASE_URL in .env.local' })
  }
  const backendBase = rawBase.replace(/\/$/, '')

  try {
    const { username, password } = req.body

    const backendRes = await fetch(`${backendBase}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return res.status(backendRes.status).json(data);
    }

    const refresh = data.refresh;
    if (refresh) {
      // Set the refresh token in an httpOnly cookie
      res.setHeader('Set-Cookie', `ccgd_refresh=${refresh}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`);
    }

    // Return only the access token to the client-side
    return res.status(200).json({ access: data.access });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login proxy error' })
  }
}
