export type RawSourceItem = {
  externalId?: string;
  title: string;
  url: string;
  summary?: string;
  rawText: string;
  company?: string;
  location?: string;
  postedAt?: string;
};

export type ConnectorResult = {
  fetchedAt: string;
  items: RawSourceItem[];
};

export interface SourceConnector {
  fetch(): Promise<ConnectorResult>;
}

export class StubRssConnector implements SourceConnector {
  async fetch(): Promise<ConnectorResult> {
    return {
      fetchedAt: new Date().toISOString(),
      items: [
        {
          externalId: 'stub-1',
          title: 'Stub RSS opportunity',
          url: 'https://example.com/stub-rss-opportunity',
          summary: 'A starter opportunity returned from the stub RSS connector.',
          rawText: 'Stub RSS opportunity for Gig Radar.',
          company: 'Starter Feed',
          location: 'Remote',
          postedAt: new Date().toISOString(),
        },
      ],
    };
  }
}

export * from './rss';
