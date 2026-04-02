import { NextResponse } from 'next/server';
import { parseTelegramCallbackData } from '@opsmesh/openclaw-adapter';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { callback_data?: string; sender?: string; note?: string };
    const parsed = parseTelegramCallbackData(body.callback_data ?? '');

    if (!parsed) {
      return NextResponse.json({ error: 'Invalid callback_data' }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    const forwarded = await fetch(`${origin}/api/radar/inbound/telegram`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        callbackToken: parsed.callbackToken,
        action: parsed.action,
        sender: body.sender,
        note: body.note,
      }),
    });

    const payload = await forwarded.json();
    return NextResponse.json(payload, { status: forwarded.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Telegram callback handling failed.' },
      { status: 500 },
    );
  }
}
