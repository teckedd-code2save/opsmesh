import { NextResponse } from 'next/server';
import { createProposalDraft, getOpportunity, getLatestDraftForOpportunity, makeTelegramCallbackToken, radarRepository, updateOpportunityStatus } from '@opsmesh/radar-core';
import { draftProposal, sendTelegramMessage } from '@opsmesh/openclaw-adapter';
import { cleanListingText } from '@/lib/text';

type InboundAction = 'save' | 'reject' | 'draft' | 'more';

type InboundPayload = {
  opportunityId?: string;
  callbackToken?: string;
  action?: InboundAction;
  note?: string;
  sender?: string;
};

async function applyAction(opportunityId: string, action: InboundAction) {
  if (action === 'save') {
    return { action: 'saved', item: updateOpportunityStatus(opportunityId, 'saved') };
  }

  if (action === 'reject') {
    return { action: 'rejected', item: updateOpportunityStatus(opportunityId, 'rejected') };
  }

  const item = getOpportunity(opportunityId);
  if (action === 'more') {
    if (!item) {
      return { action: 'more', item: null, detailSent: false };
    }

    const detailMessage = [
      `📎 ${cleanListingText(item.title)}`,
      item.summary ? cleanListingText(item.summary) : cleanListingText(item.rawText).slice(0, 500),
      `Source: ${item.sourceName}`,
      `Fit: ${item.score?.fitScore ?? 0}/100`,
      `Link: ${item.canonicalUrl}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const delivery = await sendTelegramMessage(detailMessage);
    return { action: 'more', item, detailSent: delivery.delivered, deliveryError: delivery.error };
  }
  if (!item) {
    return { action: 'drafted', item: null, draft: null };
  }

  const existingDraft = getLatestDraftForOpportunity(opportunityId);
  if (existingDraft) {
    updateOpportunityStatus(opportunityId, 'drafted');
    return { action: 'drafted', item: getOpportunity(opportunityId), draft: existingDraft, reused: true };
  }

  const generated = await draftProposal({
    title: cleanListingText(item.title),
    company: cleanListingText(item.company),
    summary: cleanListingText(item.summary),
    sourceName: item.sourceName,
    canonicalUrl: item.canonicalUrl,
    recommendation: item.score?.recommendation,
    fitScore: item.score?.fitScore,
    strengths: item.score?.strengths,
  });

  const draft = createProposalDraft({
    opportunityId: item.id,
    subjectLine: generated.subjectLine,
    body: generated.body,
    talkingPoints: generated.talkingPoints,
  });

  return { action: 'drafted', item: getOpportunity(opportunityId), draft, reused: false };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InboundPayload;

    if ((!body.opportunityId && !body.callbackToken) || !body.action) {
      return NextResponse.json({ error: 'opportunityId/callbackToken and action are required' }, { status: 400 });
    }

    const resolvedOpportunityId = body.opportunityId ?? radarRepository.listOpportunities().find((entry) => makeTelegramCallbackToken(entry.id) === body.callbackToken)?.id;
    if (!resolvedOpportunityId) {
      return NextResponse.json({ error: 'Opportunity not found for callback token' }, { status: 404 });
    }

    const item = getOpportunity(resolvedOpportunityId);
    if (!item) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const result = await applyAction(resolvedOpportunityId, body.action);
    return NextResponse.json({
      ok: true,
      mode: 'telegram-inbound-hook',
      opportunityId: resolvedOpportunityId,
      sender: body.sender ?? null,
      note: body.note ?? null,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Inbound Telegram hook failed.' },
      { status: 500 },
    );
  }
}
