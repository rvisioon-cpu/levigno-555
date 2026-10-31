"use client";

// ============================================================================
// ServiceWorkerRegistrar — LIVIGNO 555
//
// MODO OFFLINE: DESACTIVADO POR DEFECTO ("OFF").
// Para no interferir con usuarios normales ni solicitar descargas,
// solo se activa si NEXT_PUBLIC_ENABLE_OFFLINE === 'true' o si se
// accede explícitamente con ?offline=1 en la URL.
// ============================================================================

import { useEffect } from 'react';
import { ASSET_BASE_URL } from '@/utils/assets';

const ServiceWorkerRegistrar = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const searchParams = new URLSearchParams(window.location.search);
    const isExplicitOffline = searchParams.get('offline') === '1';
    const isEnvEnabled = process.env.NEXT_PUBLIC_ENABLE_OFFLINE === 'true';
    const shouldEnableOffline = isEnvEnabled || isExplicitOffline;

    // Si el modo offline está OFF:
    // Asegurar que cualquier service worker previo se desregistre y limpie cachés
    if (!shouldEnableOffline) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        })
        .catch(() => {});

      if ('caches' in window) {
        caches
          .keys()
          .then((names) => {
            for (const name of names) {
              if (name.startsWith('livigno-')) {
                caches.delete(name);
              }
            }
          })
          .catch(() => {});
      }
      return;
    }

    // Si el modo offline está ON: registrar con el flag enabled=true
    const url = `/sw.js?enabled=true&media=${encodeURIComponent(ASSET_BASE_URL)}`;
    navigator.serviceWorker.register(url).catch((error) => {
      console.warn('No se pudo registrar el service worker de modo offline:', error);
    });
  }, []);

  return null;
};

export default ServiceWorkerRegistrar;
