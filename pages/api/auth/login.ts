import type { NextApiRequest, NextApiResponse } from 'next'

// POST /api/auth/login -> proxy to backend /api/token/ and set httpOnly refresh cookie
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  if (!rawBase) {
    return res.status(500).json({ error: 'Backend URL not configured. Set NEXT_PUBLIC_API_BASE_URL in .env.local' })
  }
  const backendBase = rawBase.replace(/\/$/, '')
  try {
    // Build a few credential payload candidates to satisfy different backends
    const { username, email, password } = req.body as any
    const candidates = [
      { username, password },
      { email: username || email, password },
      { email, password },
      { identifier: username || email, password }
    ].filter((c) => c.password && (c.username || c.email || c.identifier))

    // Endpoints to try in order
    const endpoints = [
      '/api/auth/login/',
      '/api/token/',
      '/api/token/obtain/',
      '/auth/jwt/create/'
    ]

    let data: any = null
    let ok = false
    let status = 500
    let usedEndpoint = ''
    const debugInfo: any[] = []
    for (const ep of endpoints) {
      for (const body of candidates) {
        try {
          const r = await fetch(`${backendBase}${ep}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })
          status = r.status
          const raw = await r.text()
          let parsed: any = {}
          try { parsed = JSON.parse(raw) } catch { parsed = { _raw: raw.slice(0,500) } }
          data = parsed
          ok = r.ok
          usedEndpoint = ep
          debugInfo.push({ endpoint: ep, status: r.status, keys: Object.keys(data || {}), rawLength: JSON.stringify(data || {}).length, credentialKeys: Object.keys(body), hasRaw: !!parsed._raw })
          // Mirror refresh cookie from backend if present
          const setCookie = r.headers.get('set-cookie') || ''
          const m = setCookie.match(/(^|;\s*)(refresh_token|refresh|ccgd_refresh)=([^;]+)/i)
          if (m && m[3]) {
            res.setHeader('Set-Cookie', `ccgd_refresh=${m[3]}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`)
            if (!data.refresh && !data.refresh_token) data.refresh = m[3]
          }
          if (ok) break
        } catch (e) {
          debugInfo.push({ endpoint: ep, error: (e as any)?.message })
          // continue trying others
        }
      }
      if (ok) break
    }
    if (!ok) return res.status(status).json(data || { error: 'Login failed' })

    // Accept multiple field names
    const refresh = data.refresh || data.refresh_token
    let access = data.access || data.access_token || data.token
    if (refresh) {
      // set httpOnly cookie for refresh token
      res.setHeader('Set-Cookie', `ccgd_refresh=${refresh}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`)
    }

    // If backend didn't return an access token, exchange refresh -> access now
    if (!access && refresh) {
      async function tryRefresh(url: string) {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh })
        })
        const raw = await r.text()
        let parsed: any = {}
        try { parsed = JSON.parse(raw) } catch { parsed = { _raw: raw.slice(0,500) } }
        const result = { ok: r.ok, status: r.status, data: parsed, endpoint: url }
        debugInfo.push({ refreshAttempt: url, status: r.status, keys: Object.keys(parsed), hasRaw: !!parsed._raw })
        return result
      }
      let result = await tryRefresh(`${backendBase}/api/token/refresh/`)
      if (!result.ok && result.status === 404) {
        result = await tryRefresh(`${backendBase}/api/auth/refresh/`)
      }
      if (!result.ok && result.status === 404) {
        result = await tryRefresh(`${backendBase}/auth/jwt/refresh/`)
      }
      if (result.ok) {
        access = result.data?.access || result.data?.access_token || result.data?.token
      }
    }

    if (!access) {
      // As a last attempt, try to discover any JWT-looking string in the response
      const flatValues = JSON.stringify(data)
      const m = flatValues && flatValues.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/)
      if (m) access = m[0]
    }
    if (!access) {
      return res.status(400).json({ error: 'No access token from backend', endpoint: usedEndpoint, debug: debugInfo, response: data })
    }
    return res.status(200).json({ access })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login proxy error' })
  }
}
