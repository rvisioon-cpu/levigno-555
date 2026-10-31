// ============================================================================
// Manifiesto de aplicación web — permite instalar el Showroom como app standalone
// ============================================================================

import type { MetadataRoute } from 'next';
import config from '@/config/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: config.appName,
    short_name: 'Livigno 555',
    description: config.appDescription,
    start_url: '/',
    display: 'standalone',
    background_color: config.colors.main,
    theme_color: config.colors.main,
    orientation: 'landscape',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  };
}
