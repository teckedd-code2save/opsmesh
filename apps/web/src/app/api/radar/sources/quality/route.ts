import { NextResponse } from 'next/server';
import { radarRepository } from '@opsmesh/radar-core';

export async function GET() {
  const sources = radarRepository.listSources().map((source) => ({
    id: source.id,
    name: source.name,
    active: source.active,
    kind: source.kind,
    parserKey: source.parserKey,
    qualityScore: source.qualityScore ?? 0,
    totalPolls: source.totalPolls ?? 0,
    totalOpportunitiesSeen: source.totalOpportunitiesSeen ?? 0,
    totalRelevantSeen: source.totalRelevantSeen ?? 0,
    consecutiveLowSignalRuns: source.consecutiveLowSignalRuns ?? 0,
    autoDisabledAt: source.autoDisabledAt ?? null,
    lastPollStatus: source.lastPollStatus ?? 'idle',
    lastPollMessage: source.lastPollMessage ?? null,
  })).sort((a, b) => b.qualityScore - a.qualityScore);

  return NextResponse.json({ results: sources });
}
