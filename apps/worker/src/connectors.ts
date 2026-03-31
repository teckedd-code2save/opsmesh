import { RssConnector, StubRssConnector } from '@opsmesh/source-connectors';

export async function pollStubSources() {
  const connector = new StubRssConnector();
  return connector.fetch();
}

export async function pollRealRss(feedUrl: string) {
  const connector = new RssConnector(feedUrl);
  return connector.fetch();
}
