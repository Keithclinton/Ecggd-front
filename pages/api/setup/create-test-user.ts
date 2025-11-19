import type { NextApiRequest, NextApiResponse } from 'next'

// GET /api/setup/create-test-user -> create a test user via backend register endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const backendBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
  try {
    const username = 'testuser'
    const password = 'Testpass123!'
    const email = 'testuser@example.com'

    const r = await fetch(`${backendBase}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    })
    const data = await r.json()
    if (!r.ok) return res.status(r.status).json(data)
    return res.status(201).json({ username, password, message: 'Test user created (or already exists)' })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Test user creation failed' })
  }
}
