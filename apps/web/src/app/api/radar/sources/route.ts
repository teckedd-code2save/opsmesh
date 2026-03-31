import { NextResponse } from 'next/server';
import { radarRepository } from '@opsmesh/radar-core';

export async function GET() {
  return NextResponse.json({ results: radarRepository.listSources() });
}
