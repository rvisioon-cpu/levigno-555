'use client';
import { useEffect, useState } from 'react';

type PublicSettings = { theme?: { primaryColor?: string; secondaryColor?: string; typography?: string } | null; featureOrder?: string[]; states: Record<string, string>; features: Record<string, boolean>; units: Record<string, { tourUrl: string | null; bedrooms: number | null; bathrooms: number | null; dimensions: number | null }> };
export function usePublicSettings() {
  const [settings, setSettings] = useState<PublicSettings>({ states: {}, features: {}, units: {} });
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/public-settings', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setSettings(data); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  return settings;
}
export function publicUnitStatus(state?: string): 'sold' | 'reserved' | 'available' | undefined {
  return state === 'SOLD' ? 'sold' : state === 'RESERVED' ? 'reserved' : state === 'AVAILABLE' ? 'available' : undefined;
}

import type { Unit } from '@/data/floors';
export function mergePublicUnit(unit: Unit, settings: PublicSettings): Unit {
  const detail = settings.units[unit.id];
  return { ...unit, status: publicUnitStatus(settings.states[unit.id]) ?? unit.status,
    ...(detail ? { tourUrl: detail.tourUrl || undefined, bedrooms: detail.bedrooms ?? undefined, bathrooms: detail.bathrooms ?? undefined, dimensions: detail.dimensions ?? unit.dimensions } : {}) };
}
