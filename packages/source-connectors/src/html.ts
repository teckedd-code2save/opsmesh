import type { ConnectorResult, RawSourceItem, SourceConnector } from './index';

function decodeHtml(input: string) {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function stripHtml(input: string) {
  return decodeHtml(input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function absolutize(baseUrl: string, href: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

export class HtmlConnector implements SourceConnector {
  constructor(
    private readonly pageUrl: string,
    private readonly parserKey: string,
    private readonly baseUrl?: string,
  ) {}

  async fetch(): Promise<ConnectorResult> {
    const res = await fetch(this.pageUrl, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; OpsMesh/1.0; +https://openclaw.ai)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) throw new Error(`HTML fetch failed: ${res.status}`);
    const html = await res.text();

    if (this.parserKey === 'html:flexjobs-search') {
      return {
        fetchedAt: new Date().toISOString(),
        items: parseFlexJobsSearch(html, this.baseUrl ?? this.pageUrl),
      };
    }

    throw new Error(`Unsupported HTML parser: ${this.parserKey}`);
  }
}

function parseFlexJobsSearch(html: string, baseUrl: string): RawSourceItem[] {
  const containers = [
    ...html.matchAll(/<(article|li|div)[^>]*>([\s\S]{120,2400}?)<\/\1>/gi),
  ];

  const seen = new Set<string>();
  const items: RawSourceItem[] = [];

  for (const match of containers) {
    const block = match[2] ?? '';
    if (!/(job|career|position|apply|remote)/i.test(block)) continue;

    const hrefMatch = /href="([^"]*(?:\/jobs\/|\/job-search\/|\/job\/)[^"]+)"/i.exec(block);
    if (!hrefMatch) continue;

    const url = absolutize(baseUrl, hrefMatch[1]);
    if (!url || seen.has(url)) continue;

    const headingMatch = /<(h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/\1>/i.exec(block);
    const title = stripHtml(headingMatch?.[2] ?? block).slice(0, 180);
    if (!title || title.length < 12) continue;

    const text = stripHtml(block).slice(0, 400);
    const companyMatch = /(?:company|at)\s+([A-Z][A-Za-z0-9&.,'\- ]{2,60})/.exec(text);

    seen.add(url);
    items.push({
      externalId: url,
      title,
      url,
      summary: text,
      rawText: text,
      location: /remote/i.test(text) ? 'Remote' : undefined,
      company: companyMatch?.[1]?.trim(),
      postedAt: new Date().toISOString(),
    });
  }

  return items.slice(0, 25);
}
