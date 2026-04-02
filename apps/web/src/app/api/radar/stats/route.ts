import { NextResponse } from 'next/server';
import { listOpportunities, listSources } from '@opsmesh/radar-core';

export async function GET() {
  const opps = listOpportunities();
  const today = new Date().toDateString();
  const leadsToday = opps.filter((o) => new Date(o.fetchedAt).toDateString() === today).length;
  const activeSources = listSources().filter((s) => s.active).length;
  return NextResponse.json({ leadsToday, activeSources, total: opps.length });
}
