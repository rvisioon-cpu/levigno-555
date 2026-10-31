"use client";

// ============================================================================
// Registra el service worker que sirve la demo sin internet en Livigno.
//
// El origen del bucket viaja en la QUERY de la URL de registro, no en un
// mensaje posterior: el worker lo necesita de forma síncrona en cada arranque
// y `/sw.js` explica por qué con detalle.
// ============================================================================

import { useEffect } from 'react';
import { ASSET_BASE_URL } from '@/utils/assets';

const ServiceWorkerRegistrar = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // En desarrollo el worker estorba con Fast Refresh y HMR.
    // Solo permitimos registrar en dev si explícitamente se incluye ?offline=1 en la URL.
    const searchParams = new URLSearchParams(window.location.search);
    const allowInDev = searchParams.get('offline') === '1';

    if (process.env.NODE_ENV !== 'production' && !allowInDev) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }

    const url = `/sw.js?media=${encodeURIComponent(ASSET_BASE_URL)}`;
    navigator.serviceWorker.register(url).catch((error) => {
      console.warn('No se pudo registrar el service worker de modo offline:', error);
    });
  }, []);

  return null;
};

export default ServiceWorkerRegistrar;
