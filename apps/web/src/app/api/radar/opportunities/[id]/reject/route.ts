import { NextResponse } from 'next/server';
import { updateOpportunityStatus } from '@opsmesh/radar-core';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const item = updateOpportunityStatus(params.id, 'rejected');
  if (!item) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  return NextResponse.json({ ok: true, id: params.id, action: 'rejected', item, mode: 'mock' });
}
