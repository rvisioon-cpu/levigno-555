'use client';
import { useEffect } from 'react';
import { usePublicSettings } from '@/hooks/usePublicSettings';

export default function IdentityTheme() {
  const { theme } = usePublicSettings();
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    const changes: [string, string | undefined][] = [
      ['--color-brand-primary', theme.primaryColor], ['--color-brand-orange', theme.secondaryColor],
    ];
    for (const [key, value] of changes) if (value && /^#[0-9a-f]{6}$/i.test(value)) root.style.setProperty(key, value);
    return () => { for (const [key] of changes) root.style.removeProperty(key); };
  }, [theme]);
  return null;
}
