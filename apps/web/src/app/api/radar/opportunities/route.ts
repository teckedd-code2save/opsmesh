import { NextResponse } from 'next/server';
import { radarRepository } from '@opsmesh/radar-core';
import { cleanListingText, truncateText } from '@/lib/text';

export async function GET() {
  const results = radarRepository.listOpportunities().map((item) => ({
    ...item,
    title: cleanListingText(item.title),
    company: cleanListingText(item.company),
    location: cleanListingText(item.location),
    summary: truncateText(cleanListingText(item.summary || item.rawText), 220),
    rawText: cleanListingText(item.rawText),
  }));

  return NextResponse.json({ results });
}
