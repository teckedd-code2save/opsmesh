import { NextResponse } from 'next/server';
import { radarRepository, addSource } from '@opsmesh/radar-core';

export async function GET() {
  return NextResponse.json({ results: radarRepository.listSources() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const source = addSource({
    name: body.name,
    kind: body.kind ?? 'rss',
    baseUrl: body.baseUrl ?? '',
    feedUrl: body.feedUrl,
    parserKey: body.parserKey ?? 'rss:custom',
    active: true,
    pollIntervalMin: body.pollIntervalMin ?? 30,
  });
  return NextResponse.json({ ok: true, source });
}
