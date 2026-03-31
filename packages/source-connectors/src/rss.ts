import type { ConnectorResult, RawSourceItem, SourceConnector } from './index';

function extractTag(block: string, tag: string) {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(block);
  return match?.[1]?.trim();
}

function stripCdata(input: string) {
  return input.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

export class RssConnector implements SourceConnector {
  constructor(private readonly feedUrl: string) {}

  async fetch(): Promise<ConnectorResult> {
    const res = await fetch(this.feedUrl);
    if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

    const xml = await res.text();
    const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1]);

    const items: RawSourceItem[] = itemBlocks.map((block, index) => ({
      externalId: stripCdata(extractTag(block, 'guid') ?? `rss-${index}`),
      title: stripCdata(extractTag(block, 'title') ?? 'Untitled opportunity'),
      url: stripCdata(extractTag(block, 'link') ?? ''),
      summary: stripCdata(extractTag(block, 'description') ?? ''),
      rawText: stripCdata(extractTag(block, 'description') ?? ''),
      postedAt: stripCdata(extractTag(block, 'pubDate') ?? ''),
      company: undefined,
      location: undefined,
    }));

    return {
      fetchedAt: new Date().toISOString(),
      items: items.filter((item) => item.url),
    };
  }
}
