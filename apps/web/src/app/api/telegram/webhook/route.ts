import { NextResponse } from 'next/server';
import { parseTelegramCallbackData } from '@opsmesh/openclaw-adapter';

async function getBotToken(): Promise<string> {
  try {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const raw = await readFile(path.resolve(process.env.HOME ?? '~', '.openclaw/openclaw.json'), 'utf8');
    const cfg = JSON.parse(raw);
    return process.env.TELEGRAM_BOT_TOKEN ?? cfg?.channels?.telegram?.botToken ?? '';
  } catch { return process.env.TELEGRAM_BOT_TOKEN ?? ''; }
}

async function answerCallbackQuery(token: string, callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text ?? '✓', show_alert: false }),
  }).catch(() => {});
}

export async function POST(req: Request) {
  try {
    const update = await req.json() as any;

    if (update.callback_query) {
      const cq = update.callback_query;
      const token = await getBotToken();
      const parsed = parseTelegramCallbackData(cq.data ?? '');

      if (!parsed) {
        await answerCallbackQuery(token, cq.id, '⚠️ Unknown action');
        return NextResponse.json({ ok: true });
      }

      const origin = new URL(req.url).origin;
      const result = await fetch(`${origin}/api/radar/inbound/telegram`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ callbackToken: parsed.callbackToken, action: parsed.action }),
      });
      const payload = await result.json().catch(() => ({})) as any;

      const actionLabels: Record<string, string> = {
        saved: '✓ Saved',
        rejected: '✗ Rejected',
        drafted: '✓ Draft ready',
        more: '✓ Details sent',
      };
      const text = actionLabels[payload.action] ?? '✓ Done';
      await answerCallbackQuery(token, cq.id, text);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 200 }); // always 200 to Telegram
  }
}
