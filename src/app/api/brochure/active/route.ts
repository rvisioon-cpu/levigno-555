import { NextResponse } from "next/server";
import { getActiveBrochure } from "@/app/actions/brochure";


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId') || undefined;

    const active = await getActiveBrochure(unitId);
    if (active) {
      return NextResponse.json({ url: active.url, title: active.title }, { headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ url: null, title: null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching active brochure:", error);
    return NextResponse.json({ url: null }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
