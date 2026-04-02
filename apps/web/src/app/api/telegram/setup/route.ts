import { NextResponse } from 'next/server';

async function getBotToken(): Promise<string> {
  try {
    const { readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const raw = await readFile(path.resolve(process.env.HOME ?? '~', '.openclaw/openclaw.json'), 'utf8');
    const cfg = JSON.parse(raw);
    return process.env.TELEGRAM_BOT_TOKEN ?? cfg?.channels?.telegram?.botToken ?? '';
  } catch { return process.env.TELEGRAM_BOT_TOKEN ?? ''; }
}

export async function POST(req: Request) {
  try {
    const { webhookUrl } = await req.json() as { webhookUrl: string };
    if (!webhookUrl) return NextResponse.json({ error: 'webhookUrl required' }, { status: 400 });

    const token = await getBotToken();
    if (!token) return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });

    const fullUrl = `${webhookUrl.replace(/\/$/, '')}/api/telegram/webhook`;

    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: fullUrl, allowed_updates: ['callback_query', 'message'], drop_pending_updates: true }),
    });
    const data = await res.json() as any;

    if (!data.ok) return NextResponse.json({ error: data.description ?? 'Telegram rejected webhook' }, { status: 400 });
    return NextResponse.json({ ok: true, webhookUrl: fullUrl });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Setup failed' }, { status: 500 });
  }
}

export async function DELETE(_req: Request) {
  try {
    const token = await getBotToken();
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 500 });
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: 'POST' });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
