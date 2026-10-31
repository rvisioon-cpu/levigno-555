import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { units, globalSettings, constructionProgress } from '@/lib/db/schema';
import { isNull, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const db = await getDb();
    const [rows, settings, progress] = await Promise.all([
      db.select({ id: units.id, state: units.state, tourUrl: units.tourUrl, bedrooms: units.bedrooms, bathrooms: units.bathrooms, dimensions: units.areaSqm }).from(units).where(isNull(units.deletedAt)),
      db.select({ id: globalSettings.id, config: globalSettings.config }).from(globalSettings).where(inArray(globalSettings.id, ['sidebar_features_list', 'identity'])),
      db.select({ id: constructionProgress.id }).from(constructionProgress).where(isNull(constructionProgress.deletedAt)).limit(1),
    ]);
    let features: Record<string, boolean> = {};
    const featureSetting = settings.find(item => item.id === 'sidebar_features_list');
    let featureOrder: string[] = [];
    if (featureSetting) {
      const parsed: unknown = JSON.parse(featureSetting.config);
      if (Array.isArray(parsed)) featureOrder = parsed.filter(v => typeof v?.id === 'string').map(v => v.id);
      if (Array.isArray(parsed)) features = Object.fromEntries(parsed.filter((v) => typeof v?.id === 'string' && typeof v?.active === 'boolean').map((v) => [v.id, v.active]));
    }
    const identitySetting = settings.find(item => item.id === 'identity');
    const identity = identitySetting ? JSON.parse(identitySetting.config) : null;
    const theme = identity && typeof identity === 'object' ? { primaryColor: identity.primaryColor, secondaryColor: identity.secondaryColor, typography: identity.typography } : null;
    return NextResponse.json({ theme, featureOrder, hasProgress: progress.length > 0, states: Object.fromEntries(rows.map((u) => [u.id, u.state])), features, units: Object.fromEntries(rows.map((u) => [u.id, { tourUrl: u.tourUrl, bedrooms: u.bedrooms, bathrooms: u.bathrooms, dimensions: u.dimensions }])) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Datos no disponibles' }, { status: 503 });
  }
}
