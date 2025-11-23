import type { NextApiRequest, NextApiResponse } from 'next'

// POST /api/auth/logout -> clear the HttpOnly refresh cookie
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  
  try {
    // Clear the httpOnly refresh cookie
    res.setHeader('Set-Cookie', `ccgd_refresh=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Logout error' });
  }
}
