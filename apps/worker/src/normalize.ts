import type { RawSourceItem } from '@opsmesh/source-connectors';

export function normalizeRawItem(item: RawSourceItem) {
  return {
    externalId: item.externalId,
    canonicalUrl: item.url,
    title: item.title,
    company: item.company,
    location: item.location,
    summary: item.summary,
    rawText: item.rawText,
    remote: (item.location ?? '').toLowerCase().includes('remote'),
    postedAt: item.postedAt,
  };
}
