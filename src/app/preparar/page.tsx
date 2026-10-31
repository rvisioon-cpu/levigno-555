"use client";

// ============================================================================
// PREPARAR EL SHOWROOM OFFLINE — LIVIGNO 555
// Pantalla para descargar todos los assets y vistas de la demo antes de
// presentar en salas de ventas o eventos sin internet.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CloudDownload,
  Loader2,
  RefreshCw,
  WifiOff,
  Database,
  Layers,
} from 'lucide-react';

import {
  ASSET_BASE_URL,
  CorsNotConfiguredError,
  clearOfflineCaches,
  downloadAssets,
  estimateStorage,
  formatBytes,
  formatDuration,
  getLivignoRoutesToWarm,
  inspectCache,
  loadManifest,
  requestPersistentStorage,
  warmShell,
  type CacheStatus,
  type PrecacheManifest,
  type Progress,
  type StorageEstimate,
} from '@/utils/offline';

type Phase = 'checking' | 'idle' | 'downloading' | 'error';

export default function PrepararPage() {
  const [phase, setPhase] = useState<Phase>('checking');
  const [manifest, setManifest] = useState<PrecacheManifest | null>(null);
  const [status, setStatus] = useState<CacheStatus | null>(null);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [step, setStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    try {
      const loaded = await loadManifest();
      setManifest(loaded);
      setStatus(await inspectCache(loaded.tiers));
      setStorage(await estimateStorage());
      setPhase('idle');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const start = async () => {
    if (!manifest) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase('downloading');
    setFailures([]);
    setError(null);

    try {
      // Registrar el Service Worker explícitamente para este dispositivo
      if ('serviceWorker' in navigator) {
        const url = `/sw.js?enabled=true&media=${encodeURIComponent(ASSET_BASE_URL)}`;
        await navigator.serviceWorker.register(url).catch(() => {});
      }

      // 1. Solicitar cuota persistente para evitar desalojo accidental
      await requestPersistentStorage();

      // 2. Calentar Shell y rutas de Next.js
      setStep('Guardando pantallas y vistas del edificio...');
      const routes = getLivignoRoutesToWarm();
      const shell = await warmShell(routes, (route, index, total) => {
        setStep(`Guardando pantallas (${index + 1}/${total}) — ${route}`);
      });

      // 3. Descargar Tiers de media en orden (critical -> full)
      const collected: string[] = [...shell.failed];
      for (const tier of manifest.tiers) {
        setStep(`Descargando ${tier.label}...`);
        const result = await downloadAssets(tier.assets, {
          signal: controller.signal,
          onProgress: setProgress,
        });
        collected.push(...result.failed);
        if (controller.signal.aborted) break;
      }

      setFailures(collected);
    } catch (caught) {
      setError(
        caught instanceof CorsNotConfiguredError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : String(caught),
      );
    } finally {
      abortRef.current = null;
      setProgress(null);
      setStep('');
      await refresh();
    }
  };

  const stop = () => abortRef.current?.abort();

  const reset = async () => {
    if (confirm('¿Deseas eliminar todos los archivos descargados del showroom?')) {
      await clearOfflineCaches();
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      await refresh();
    }
  };

  if (phase === 'checking') {
    return (
      <main className="grid h-screen w-screen place-items-center bg-[#0d1114] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#ce994d]" />
          <p className="text-sm tracking-widest uppercase text-white/70">
            Comprobando archivos locales...
          </p>
        </div>
      </main>
    );
  }

  const ready = status !== null && status.missingKeys.length === 0 && status.totalFiles > 0;
  const partial = status !== null && status.cachedFiles > 0 && !ready;
  const percent = status && status.totalBytes > 0 ? (status.cachedBytes / status.totalBytes) * 100 : 0;

  const livePercent =
    progress && progress.totalBytes > 0 ? (progress.bytes / progress.totalBytes) * 100 : 0;
  const remainingSeconds =
    progress && progress.bytesPerSecond > 0
      ? (progress.totalBytes - progress.bytes) / progress.bytesPerSecond
      : Infinity;

  return (
    <main className="h-screen w-screen overflow-y-auto bg-[#0d1114] px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-[#ce994d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la portada
        </Link>

        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-[#ce994d]" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Preparar Showroom Offline — Livigno 555
          </h1>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Descarga el showroom completo con todas las fotos, planos de plantas, tipologías (T1–T12)
          y videos de fachada para realizar presentaciones fluidas <strong>sin conexión a internet</strong>.
          Realiza este proceso con buena conexión antes de la presentación.
        </p>

        {/* ---------------------------------------------------------------- */}
        {/* Estado general                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section
          className={`mt-8 rounded-2xl border p-6 transition-colors ${
            ready
              ? 'border-emerald-500/40 bg-emerald-950/20'
              : partial
                ? 'border-amber-500/40 bg-amber-950/20'
                : 'border-white/10 bg-white/5'
          }`}
        >
          <div className="flex items-start gap-4">
            {ready ? (
              <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-400" />
            ) : partial ? (
              <AlertTriangle className="mt-0.5 h-8 w-8 shrink-0 text-amber-400" />
            ) : (
              <WifiOff className="mt-0.5 h-8 w-8 shrink-0 text-white/40" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold tracking-wide">
                {ready
                  ? 'Listo para presentar sin internet'
                  : partial
                    ? 'Descarga parcial / incompleta'
                    : 'Showroom aún no descargado'}
              </p>
              <p className="mt-1 text-sm text-white/60">
                {status
                  ? `${status.cachedFiles} de ${status.totalFiles} archivos descargados · ${formatBytes(
                      status.cachedBytes,
                    )} de ${formatBytes(status.totalBytes)}`
                  : null}
              </p>

              {!ready && status && status.totalFiles > 0 ? (
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#ce994d] transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Resumen por Tiers                                                */}
        {/* ---------------------------------------------------------------- */}
        {manifest && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {manifest.tiers.map((tier) => (
              <div
                key={tier.id}
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#ce994d]">
                    {tier.id === 'critical' ? 'Prioridad Alta' : 'Material Completo'}
                  </span>
                  <h3 className="mt-1 text-sm font-medium text-white">{tier.label}</h3>
                </div>
                <div className="mt-3 flex items-baseline justify-between text-xs text-white/60">
                  <span>{tier.assets.length} archivos</span>
                  <span className="font-mono">{formatBytes(tier.bytes)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Progreso de descarga activa                                      */}
        {/* ---------------------------------------------------------------- */}
        {phase === 'downloading' ? (
          <section className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#ce994d]" />
              <p className="font-medium text-white">{step || 'Descargando showroom...'}</p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ce994d] to-[#31535b] transition-all duration-300"
                style={{ width: `${livePercent}%` }}
              />
            </div>

            {progress && (
              <div className="mt-3 space-y-1">
                <div className="flex flex-wrap justify-between gap-2 text-xs text-white/70">
                  <span>
                    {formatBytes(progress.bytes)} / {formatBytes(progress.totalBytes)} ({progress.files}/{progress.totalFiles})
                  </span>
                  <span>
                    {progress.bytesPerSecond > 0
                      ? `${formatBytes(progress.bytesPerSecond)}/s · restante: ${formatDuration(remainingSeconds)}`
                      : 'estimando...'}
                  </span>
                </div>
                <p className="truncate font-mono text-[11px] text-white/40">{progress.current}</p>
              </div>
            )}

            <button
              type="button"
              onClick={stop}
              className="mt-5 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-white/20"
            >
              Pausar / Detener
            </button>
            <p className="mt-2 text-[11px] text-white/50">
              La descarga es reanudable: puedes pausar y continuará donde se quedó.
            </p>
          </section>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={!manifest}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#ce994d] to-[#a87931] px-6 py-4 text-base font-semibold text-white shadow-xl transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <CloudDownload className="h-5 w-5" />
            {ready
              ? 'Volver a comprobar o actualizar'
              : partial
                ? 'Continuar descarga'
                : `Descargar Showroom Completo (${manifest ? formatBytes(manifest.totalBytes) : '—'})`}
          </button>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Notificaciones y Alertas                                         */}
        {/* ---------------------------------------------------------------- */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {storage && !storage.persisted && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
            Aviso: El navegador no ha otorgado persistencia estricta de disco. Si el almacenamiento
            del dispositivo es muy bajo, podría liberar cachés. Abre esta pantalla antes de presentar
            para verificar el estado.
          </div>
        )}

        {failures.length > 0 && (
          <details className="mt-4 rounded-xl border border-amber-500/30 bg-white/5 p-4 text-xs">
            <summary className="cursor-pointer font-medium text-amber-300">
              {failures.length} archivos no se pudieron descargar (haz clic para ver)
            </summary>
            <ul className="mt-2 max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] text-white/50">
              {failures.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          </details>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Pie de controles                                                 */}
        {/* ---------------------------------------------------------------- */}
        <footer className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6 text-xs text-white/60">
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recomprobar
          </button>

          <button
            type="button"
            onClick={() => void reset()}
            className="text-white/40 hover:text-red-400 transition cursor-pointer"
          >
            Borrar caché offline
          </button>

          {storage && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-white/40">
              <Database className="h-3 w-3" />
              {formatBytes(storage.usageBytes)} en uso (cuota: {formatBytes(storage.quotaBytes)})
            </span>
          )}
        </footer>
      </div>
    </main>
  );
}
