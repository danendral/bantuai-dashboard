export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const webhookUrl = process.env.N8N_TALKDB_WEBHOOK_URL
  if (!webhookUrl) {
    return new Response(JSON.stringify({ error: 'Webhook URL not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.text()
    return new Response(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to reach webhook' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
