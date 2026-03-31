import { NextResponse } from 'next/server';
import { getLatestDraftForOpportunity, getOpportunity } from '@opsmesh/radar-core';
import { cleanListingText, truncateText } from '@/lib/text';

const TELEGRAM_CHAT_ID = process.env.OPSMESH_TELEGRAM_CHAT_ID ?? 'telegram:6266009472';
const GATEWAY_BASE = process.env.OPENCLAW_GATEWAY_URL ?? 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN ?? '';

async function sendTelegramMessage(message: string) {
  if (!GATEWAY_TOKEN) {
    throw new Error('Missing OPENCLAW gateway token for Telegram send.');
  }

  const res = await fetch(`${GATEWAY_BASE}/tools/invoke`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${GATEWAY_TOKEN}`,
    },
    body: JSON.stringify({
      tool: 'message',
      args: {
        action: 'send',
        channel: 'telegram',
        target: TELEGRAM_CHAT_ID,
        message,
      },
    }),
  });

  const payload = await res.json();
  if (!res.ok || payload?.ok === false) {
    throw new Error(payload?.error?.message ?? 'Telegram send failed.');
  }

  return payload;
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const item = getOpportunity(params.id);
  if (!item) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  const draft = getLatestDraftForOpportunity(params.id);
  const message = [
    '📌 OpsMesh hit',
    `${cleanListingText(item.title)}`,
    '',
    `Fit: ${item.score?.fitScore ?? 0}/100 · ${item.score?.recommendation ?? 'unscored'}`,
    `Status: ${item.status}`,
    cleanListingText(truncateText(item.summary || item.rawText, 260)),
    '',
    `Source: ${item.sourceName}`,
    `Link: ${item.canonicalUrl}`,
    draft ? '' : null,
    draft ? 'Draft ready:' : null,
    draft ? cleanListingText(truncateText(draft.body, 420)) : null,
  ]
    .filter(Boolean)
    .join('\n');

  await sendTelegramMessage(message);

  return NextResponse.json({
    ok: true,
    action: 'sent_to_telegram',
  });
}
