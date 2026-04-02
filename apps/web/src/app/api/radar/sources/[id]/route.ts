import { NextResponse } from 'next/server';
import { updateSource, deleteSource } from '@opsmesh/radar-core';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = updateSource(params.id, body);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, source: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const deleted = deleteSource(params.id);
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
