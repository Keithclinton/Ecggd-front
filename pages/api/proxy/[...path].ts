
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Robust proxy for forwarding requests from Next dev server -> backend API.
 * - Reads raw body for JSON/multipart fidelity
 * - Adds trailing slash to auth endpoints requiring it
 * - Forwards headers (excluding host)
 * - Returns JSON as JSON, otherwise raw text
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query
  const backendBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
  const pathArray = Array.isArray(path) ? path : [String(path || '')]
  let backendPath = pathArray.join('/')

  // Ensure trailing slash for auth endpoints
  if (req.method === 'POST' && ['auth/register', 'auth/login'].includes(backendPath)) {
    if (!backendPath.endsWith('/')) backendPath += '/'
  }

  const target = `${backendBase}/api/${backendPath}`

  try {
    let rawBody: string | undefined
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      rawBody = await new Promise<string>((resolve) => {
        let data = ''
        req.on('data', (chunk) => { data += chunk })
        req.on('end', () => resolve(data))
      })
    }

    // Forward headers (drop host)
    const forwardedHeaders: Record<string, any> = { ...req.headers }
    delete forwardedHeaders.host
    Object.keys(forwardedHeaders).forEach((k) => {
      if (forwardedHeaders[k] === undefined) delete forwardedHeaders[k]
    })

    const backendResponse = await fetch(target, {
      method: req.method,
      headers: forwardedHeaders as any,
      body: rawBody
    })

    const contentType = backendResponse.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const json = await backendResponse.json().catch(async () => ({ _raw: await backendResponse.text().catch(() => '') }))
      res.status(backendResponse.status).json(json)
    } else {
      const text = await backendResponse.text()
      res.status(backendResponse.status).send(text)
    }
  } catch (err: any) {
    console.error('🔥 Proxy error:', err)
    const errMsg = err?.message || String(err)
    res.status(500).json({ error: 'Proxy server crashed', details: errMsg })
  }
}

export const config = {
  api: { bodyParser: false }
}
