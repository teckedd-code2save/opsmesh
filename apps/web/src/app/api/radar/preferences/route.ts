import { NextResponse } from 'next/server';
import { radarRepository } from '@opsmesh/radar-core';

export async function GET() {
  return NextResponse.json(radarRepository.getPreferences());
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const updated = radarRepository.savePreferences(body);
  return NextResponse.json(updated);
}
