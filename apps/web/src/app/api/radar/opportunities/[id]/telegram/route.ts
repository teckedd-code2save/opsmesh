import { NextResponse } from 'next/server';
import { getOpportunity } from '@opsmesh/radar-core';
import { buildTelegramCallbackData, sendTelegramMessage } from '@opsmesh/openclaw-adapter';
import { cleanListingText } from '@/lib/text';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const item = getOpportunity(params.id);
    if (!item) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const message = [
      '📌 OpsMesh lead',
      cleanListingText(item.title),
      `Fit ${item.score?.fitScore ?? 0}/100 · ${item.sourceName}`,
      cleanListingText(item.summary || item.rawText).slice(0, 180),
    ]
      .filter(Boolean)
      .join('\n');

    const delivery = await sendTelegramMessage(message, {
      buttons: [
        [
          { text: 'More', callback_data: buildTelegramCallbackData('more', item.id), style: 'primary' },
          { text: 'Save', callback_data: buildTelegramCallbackData('save', item.id) },
        ],
        [
          { text: 'Reject', callback_data: buildTelegramCallbackData('reject', item.id), style: 'danger' },
          { text: 'Draft', callback_data: buildTelegramCallbackData('draft', item.id), style: 'primary' },
        ],
      ],
    });

    if (!delivery.delivered) {
      throw new Error(delivery.error ?? 'Telegram send failed.');
    }

    return NextResponse.json({
      ok: true,
      action: 'sent_to_telegram',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Telegram send failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
