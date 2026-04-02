import { NextResponse } from 'next/server';
import { draftProposal } from '@opsmesh/openclaw-adapter';
import { getOpportunity, getLatestDraftForOpportunity, createProposalDraft } from '@opsmesh/radar-core';
import { cleanListingText } from '@/lib/text';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const item = getOpportunity(params.id);
  if (!item) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  const lowFitWarning =
    (item.score?.fitScore ?? 0) < 60 || item.score?.recommendation === 'avoid' || item.score?.recommendation === 'weak'
      ? 'Low-fit opportunity. Draft generated anyway.'
      : null;

  const existingDraft = getLatestDraftForOpportunity(params.id);
  if (existingDraft) {
    return NextResponse.json({
      ok: true,
      id: params.id,
      action: 'drafted',
      mode: 'persistent-local',
      item: getOpportunity(params.id),
      draft: existingDraft,
      reused: true,
      warning: lowFitWarning,
    });
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

  return NextResponse.json({
    ok: true,
    id: params.id,
    action: 'drafted',
    mode: 'persistent-local',
    item: getOpportunity(params.id),
    draft,
    reused: false,
    warning: lowFitWarning,
  });
}
