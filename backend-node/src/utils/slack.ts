// backend-node/src/utils/slack.ts
import fetch from 'node-fetch';

export async function sendSlackMessage(webhookUrl: string, text: string) {
  const payload = { text };
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`);
  return true;
}
