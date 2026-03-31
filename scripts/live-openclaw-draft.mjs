#!/usr/bin/env node
import process from 'node:process';

const gatewayBase = process.env.OPENCLAW_GATEWAY_URL ?? 'http://127.0.0.1:18789';
const token = process.env.OPENCLAW_GATEWAY_TOKEN ?? process.env.OPENCLAW_AUTH_TOKEN;
const prompt = process.argv.slice(2).join(' ').trim();

if (!prompt) {
  console.error('Missing prompt');
  process.exit(2);
}

if (!token) {
  console.error('Missing OPENCLAW gateway token');
  process.exit(3);
}

const res = await fetch(`${gatewayBase}/tools/invoke`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    tool: 'sessions_send',
    input: {
      sessionKey: 'main',
      timeoutSeconds: 45,
      message: prompt,
    },
  }),
});

const text = await res.text();
if (!res.ok) {
  console.error(text);
  process.exit(4);
}

process.stdout.write(text);
