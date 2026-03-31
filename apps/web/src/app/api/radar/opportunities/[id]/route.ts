import { NextRequest, NextResponse } from 'next/server';
import { getLatestDraftForOpportunity, getOpportunity } from '@opsmesh/radar-core';
import { cleanListingText } from '@/lib/text';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = getOpportunity(params.id);
  if (!item) {
    return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  }

  const cleanedItem = {
    ...item,
    title: cleanListingText(item.title),
    company: cleanListingText(item.company),
    location: cleanListingText(item.location),
    summary: cleanListingText(item.summary),
    rawText: cleanListingText(item.rawText),
  };

  return NextResponse.json({
    ...cleanedItem,
    latestDraft: getLatestDraftForOpportunity(params.id),
  });
}
