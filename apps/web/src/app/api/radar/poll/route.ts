import { NextResponse } from 'next/server';
import { analyzeOpportunity } from '@opsmesh/openclaw-adapter';
import { radarRepository, makeOpportunityDedupeHash, type OpportunityRecord } from '@opsmesh/radar-core';
import { RssConnector, type RawSourceItem } from '@opsmesh/source-connectors';

function stripHtml(input?: string) {
  return (input ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function payFromText(text: string) {
  const matches = [...text.matchAll(/\$\s?(\d{2,4})(?:\s?[-–]\s?\$?(\d{2,4}))?/g)];
  if (!matches.length) return { payType: 'unknown' as const, payMin: undefined, payMax: undefined, currency: undefined };
  const first = matches[0];
  return {
    payType: first[2] ? ('fixed' as const) : ('unknown' as const),
    payMin: first[1],
    payMax: first[2] ?? first[1],
    currency: 'USD',
  };
}

function isRelevantGig(item: RawSourceItem) {
  const text = `${item.title} ${item.summary ?? ''} ${item.rawText}`.toLowerCase();

  const wanted = [
    'api',
    'automation',
    'bot',
    'telegram',
    'integration',
    'webhook',
    'scrape',
    'node',
    'typescript',
    'javascript',
    'backend',
    'python',
    'chatbot',
  ];

  const unwanted = [
    'senior',
    'staff',
    'principal',
    'lead engineer',
    'full-time',
    'full time',
    'director',
    'manager',
    'salesforce',
    'vp ',
    'vice president',
  ];

  const wantedHits = wanted.filter((term) => text.includes(term)).length;
  const unwantedHits = unwanted.some((term) => text.includes(term));

  return wantedHits >= 1 && !unwantedHits;
}

async function toOpportunity(item: RawSourceItem, sourceId: string, sourceName: string): Promise<OpportunityRecord> {
  const cleanSummary = stripHtml(item.summary);
  const cleanRawText = stripHtml(item.rawText || item.summary || item.title);

  const analysis = await analyzeOpportunity({
    title: stripHtml(item.title),
    company: stripHtml(item.company),
    location: stripHtml(item.location),
    summary: cleanSummary,
    rawText: cleanRawText,
    canonicalUrl: item.url,
  });

  const pay = payFromText(`${cleanSummary} ${cleanRawText}`);
  const fetchedAt = new Date().toISOString();
  const id = makeOpportunityDedupeHash(`${sourceId}:${item.externalId ?? item.url}`).replace(/[^a-z0-9]+/g, '_').slice(0, 64) || `opp_${Date.now()}`;

  return {
    id,
    sourceId,
    sourceName,
    canonicalUrl: item.url,
    title: stripHtml(item.title),
    company: stripHtml(item.company),
    remote: true,
    location: stripHtml(item.location) || 'Remote',
    summary: cleanSummary,
    rawText: cleanRawText,
    payType: pay.payType,
    payMin: pay.payMin,
    payMax: pay.payMax,
    currency: pay.currency,
    status: 'new',
    tags: [sourceName.toLowerCase(), ...(analysis.strengths ?? [])].slice(0, 5),
    fetchedAt,
    score: analysis,
  };
}

export async function POST() {
  const sources = radarRepository.listSources().filter((source) => source.active && source.feedUrl);
  const nextSources = [...radarRepository.listSources()];
  const opportunities: OpportunityRecord[] = [];
  const errors: Array<{ sourceId: string; message: string }> = [];

  for (const source of sources) {
    try {
      const connector = new RssConnector(source.feedUrl!);
      const result = await connector.fetch();
      const items = result.items.filter(isRelevantGig).slice(0, 8);
      const converted = await Promise.all(items.map((item: RawSourceItem) => toOpportunity(item, source.id, source.name)));
      opportunities.push(...converted);

      const index = nextSources.findIndex((entry) => entry.id === source.id);
      if (index >= 0) nextSources[index] = { ...nextSources[index], lastPolledAt: result.fetchedAt };
    } catch (error) {
      errors.push({
        sourceId: source.id,
        message: error instanceof Error ? error.message : 'Unknown poll error',
      });
    }
  }

  radarRepository.replaceSources(nextSources);
  radarRepository.replaceOpportunities(opportunities.sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt)));

  return NextResponse.json({
    ok: true,
    mode: 'live-rss-openclaw-analysis-filtered',
    sourceCount: sources.length,
    resultCount: opportunities.length,
    errorCount: errors.length,
    errors,
    sources: nextSources,
    results: opportunities,
  });
}
