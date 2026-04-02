import { analyzeOpportunity, notifyHighSignalOpportunity } from '@opsmesh/openclaw-adapter';
import type { RawSourceItem } from '@opsmesh/source-connectors';
import { normalizeRawItem } from './normalize';

function toPayLabel() {
  return undefined;
}

export async function scoreFetchedItem(item: RawSourceItem, sourceName: string) {
  const normalized = normalizeRawItem(item);
  const analysis = await analyzeOpportunity({
    title: normalized.title,
    company: normalized.company,
    location: normalized.location,
    summary: normalized.summary,
    rawText: normalized.rawText,
    canonicalUrl: normalized.canonicalUrl,
  });

  const alert =
    analysis.recommendation === 'strong_match'
      ? await notifyHighSignalOpportunity({
          opportunityId: normalized.externalId ?? normalized.canonicalUrl.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
          title: normalized.title,
          sourceName,
          canonicalUrl: normalized.canonicalUrl,
          payLabel: toPayLabel(),
          recommendation: analysis.recommendation,
          fitScore: analysis.fitScore,
          reasoningSummary: analysis.reasoningSummary,
        })
      : null;

  return { normalized, analysis, alert };
}
