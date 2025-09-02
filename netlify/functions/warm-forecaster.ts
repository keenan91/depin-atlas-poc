export async function handler() {
  const base = process.env.URL || process.env.DEPLOY_URL || ''
  const targets = [
    `${base}/api/iot/h3/daily?forecast=true&horizon=1&hex=8828308291fffff&limit=1`,
    `${base}/api/iot/h3/daily?from=2025-07-01&to=2025-07-02&limit=1`,
  ]
  try {
    await Promise.allSettled(targets.map((u) => fetch(u)))
    return {statusCode: 200, body: 'ok'}
  } catch {
    return {statusCode: 200, body: 'ok'}
  }
}
