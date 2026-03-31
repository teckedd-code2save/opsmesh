import { NextResponse } from 'next/server';
import { radarRepository } from '@opsmesh/radar-core';

export async function POST() {
  const state = radarRepository.clearRadarData();
  return NextResponse.json({
    ok: true,
    mode: 'reset-live-state',
    sources: state.sources,
    results: state.opportunities,
  });
}
