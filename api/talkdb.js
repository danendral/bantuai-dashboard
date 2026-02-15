export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const webhookUrl = process.env.N8N_TALKDB_WEBHOOK_URL
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Webhook URL not configured' })
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (err) {
    console.error('Proxy error:', err)
    return res.status(500).json({ error: 'Failed to reach webhook' })
  }
}
