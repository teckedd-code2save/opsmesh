import { NextResponse } from 'next/server';
import { analyzeOpportunity, notifyHighSignalOpportunity } from '@opsmesh/openclaw-adapter';
import { radarRepository, makeCompactOpportunityId, type OpportunityRecord } from '@opsmesh/radar-core';
import { HtmlConnector, RssConnector, type RawSourceItem } from '@opsmesh/source-connectors';

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

function classifyLane(item: RawSourceItem) {
  const text = `${item.title} ${item.summary ?? ''} ${item.rawText}`.toLowerCase();
  const nonDevTerms = [
    'logo design', 'label design', 'graphic design', 'branding', 'illustrator', 'photoshop', 'video editor', 'animation',
    'content reviewer', 'content writing', 'copywriting', 'data entry', 'virtual assistant', 'seo', 'social media manager',
    'transcription', 'translation', 'bookkeeping', 'customer support', 'appointment setter', 'lead generation'
  ];
  return nonDevTerms.some((term) => text.includes(term)) ? 'nondev' : 'dev';
}

function scoreGigSignal(item: RawSourceItem, sourceQualityScore = 50) {
  const text = `${item.title} ${item.summary ?? ''} ${item.rawText}`.toLowerCase();
  const title = (item.title || '').toLowerCase();
  const lane = classifyLane(item);

  const strongPositive = ['freelance', 'contract', 'consultant', 'consulting', 'hourly', 'fixed price', 'project-based', 'short-term', 'integration', 'api', 'automation', 'telegram', 'webhook', 'bot', 'agent', 'llm'];
  const mediumPositive = ['node', 'typescript', 'javascript', 'backend', 'python', 'scrape', 'sync', 'connector', 'implementation', 'migration', 'debugging'];
  const strongNegative = ['full-time', 'full time', 'permanent role', 'benefits package', '401(k)', 'pto', 'equity package', 'medical, dental', 'head of ', 'chief ', 'vice president', 'director'];
  const mediumNegative = ['senior', 'staff', 'principal', 'manager', 'team lead', 'people manager', '5+ years', '7+ years', '8+ years', '10+ years', 'join our team', 'career growth'];

  let score = 0;
  score += strongPositive.filter((term) => text.includes(term)).length * 14;
  score += mediumPositive.filter((term) => text.includes(term)).length * 6;
  score -= strongNegative.filter((term) => text.includes(term)).length * 18;
  score -= mediumNegative.filter((term) => text.includes(term)).length * 9;

  if (/\b(contract|freelance|consultant|api|automation|integration|webhook|bot|agent)\b/.test(title)) score += 18;
  if (/\b(full[- ]?time|senior|staff|principal|manager|director|head)\b/.test(title)) score -= 24;
  if (/\b(implement|build|fix|debug|integrate|migrate|ship)\b/.test(text)) score += 10;
  if (/\b(benefits|equity|401\(k\)|vacation|health insurance)\b/.test(text)) score -= 14;
  if (lane === 'nondev') score -= 35;

  score += Math.round((sourceQualityScore - 50) * 0.25);
  return score;
}

function isRelevantGig(item: RawSourceItem, sourceQualityScore = 50) {
  const lane = classifyLane(item);
  if (lane === 'nondev') return false;
  return scoreGigSignal(item, sourceQualityScore) >= 18;
}

function computeSourceQuality(input: { fetchedCount: number; relevantCount: number; convertedCount: number; errors: number }) {
  const base = input.fetchedCount === 0 ? 0 : Math.round((input.relevantCount / input.fetchedCount) * 100);
  const conversion = input.relevantCount === 0 ? 0 : Math.round((input.convertedCount / input.relevantCount) * 100);
  const penalty = input.errors > 0 ? 20 : 0;
  return Math.max(0, Math.min(100, Math.round(base * 0.7 + conversion * 0.3 - penalty)));
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
  const id = makeCompactOpportunityId(`${sourceId}:${item.externalId ?? item.url}`) || `opp_${Date.now()}`;
  const existing = radarRepository.getOpportunity(id);

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
    status: existing?.status ?? 'new',
    lane: classifyLane(item),
    tags: [sourceName.toLowerCase(), classifyLane(item), ...(analysis.strengths ?? [])].slice(0, 6),
    fetchedAt,
    score: analysis,
    telegramDeliveredAt: existing?.telegramDeliveredAt,
    telegramDeliveryError: existing?.telegramDeliveryError,
  };
}

export async function POST(req: Request) {
  const owner = `api-poll-${Date.now()}`;
  const lock = radarRepository.acquireWorkerLock(owner);

  if (!lock) {
    return NextResponse.json(
      { ok: false, skipped: true, reason: 'worker_locked', runtime: radarRepository.getRadarRuntime() },
      { status: 409 },
    );
  }

  try {
    const sources = radarRepository.listSources().filter((source) => source.active && source.feedUrl);
    const nextSources = [...radarRepository.listSources()];
    const opportunities: OpportunityRecord[] = [];
    const errors: Array<{ sourceId: string; message: string }> = [];
    const pollStartedAt = new Date().toISOString();

    for (let i = 0; i < nextSources.length; i += 1) {
      const source = nextSources[i];
      if (!source.active || !source.feedUrl) continue;
      nextSources[i] = {
        ...source,
        lastPollStatus: 'running',
        lastPollStartedAt: pollStartedAt,
        lastPollMessage: 'Fetching latest feed items…',
      };
    }
    radarRepository.replaceSources(nextSources);

    for (const source of sources) {
      const startedAt = Date.now();
      try {
        const connector = source.kind === 'html'
          ? new HtmlConnector(source.feedUrl!, source.parserKey, source.baseUrl)
          : new RssConnector(source.feedUrl!);
        const result = await connector.fetch();
        const sourceQualityBaseline = source.qualityScore ?? 50;
        const relevantItems = result.items.filter((item) => isRelevantGig(item, sourceQualityBaseline));
        const items = relevantItems.slice(0, 8);
        const converted = await Promise.all(items.map((item) => toOpportunity(item, source.id, source.name)));
        opportunities.push(...converted);

        const index = nextSources.findIndex((entry) => entry.id === source.id);
        if (index >= 0) {
          const prev = nextSources[index];
          const qualityScore = computeSourceQuality({ fetchedCount: result.items.length, relevantCount: relevantItems.length, convertedCount: converted.length, errors: 0 });
          const totalPolls = (prev.totalPolls ?? 0) + 1;
          const totalOpportunitiesSeen = (prev.totalOpportunitiesSeen ?? 0) + result.items.length;
          const totalRelevantSeen = (prev.totalRelevantSeen ?? 0) + relevantItems.length;
          const consecutiveLowSignalRuns = qualityScore < 18 ? (prev.consecutiveLowSignalRuns ?? 0) + 1 : 0;
          const shouldAutoDisable = consecutiveLowSignalRuns >= 3 && totalPolls >= 3;

          nextSources[index] = {
            ...prev,
            active: shouldAutoDisable ? false : prev.active,
            autoDisabledAt: shouldAutoDisable ? new Date().toISOString() : prev.autoDisabledAt,
            lastPolledAt: result.fetchedAt,
            lastPollStatus: 'success',
            lastPollMessage: shouldAutoDisable
              ? `Auto-disabled after repeated low signal (${qualityScore})`
              : `Found ${items.length} relevant lead${items.length === 1 ? '' : 's'} · quality ${qualityScore}`,
            lastPollDurationMs: Date.now() - startedAt,
            qualityScore,
            totalPolls,
            totalOpportunitiesSeen,
            totalRelevantSeen,
            consecutiveLowSignalRuns,
          };
          radarRepository.replaceSources(nextSources);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown poll error';
        errors.push({
          sourceId: source.id,
          message,
        });

        const index = nextSources.findIndex((entry) => entry.id === source.id);
        if (index >= 0) {
          const prev = nextSources[index];
          nextSources[index] = {
            ...prev,
            lastPollStatus: 'error',
            lastPollMessage: message,
            lastPollDurationMs: Date.now() - startedAt,
            qualityScore: Math.max(0, (prev.qualityScore ?? 0) - 10),
            totalPolls: (prev.totalPolls ?? 0) + 1,
            consecutiveLowSignalRuns: (prev.consecutiveLowSignalRuns ?? 0) + 1,
          };
          radarRepository.replaceSources(nextSources);
        }
      }
    }

    radarRepository.replaceSources(nextSources);
    radarRepository.replaceOpportunities(opportunities.sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt)));

    let notifiedCount = 0;
    for (const item of opportunities.filter((entry) => entry.score?.recommendation === 'strong_match')) {
      if (item.telegramDeliveredAt) continue;

      const delivery = await notifyHighSignalOpportunity({
        opportunityId: item.id,
        title: item.title,
        sourceName: item.sourceName,
        canonicalUrl: item.canonicalUrl,
        summary: item.summary,
        payLabel: item.payMin && item.payMax && item.currency ? `${item.currency} ${item.payMin}-${item.payMax}` : undefined,
        recommendation: item.score!.recommendation,
        fitScore: item.score!.fitScore,
        reasoningSummary: item.score!.reasoningSummary,
      });

      radarRepository.markOpportunityTelegramDelivery(item.id, {
        delivered: delivery.delivered,
        error: delivery.error,
      });

      if (delivery.delivered) notifiedCount += 1;
    }

    const trigger: 'manual' | 'scheduled' = (() => {
      try {
        const url = new URL(req.url);
        return url.searchParams.get('trigger') === 'scheduled' ? 'scheduled' : 'manual';
      } catch {
        return 'manual';
      }
    })();

    const summary = {
      sourceCount: sources.length,
      resultCount: opportunities.length,
      notifiedCount,
      errorCount: errors.length,
      trigger,
    };

    radarRepository.recordWorkerRun(summary);

    return NextResponse.json({
      ok: true,
      mode: 'live-rss-openclaw-analysis-filtered',
      ...summary,
      errors,
      sources: nextSources,
      results: opportunities,
    });
  } finally {
    radarRepository.releaseWorkerLock(owner);
  }
}
