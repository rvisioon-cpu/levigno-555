import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'La generación con IA está desactivada.' }, { status: 403 });
}
