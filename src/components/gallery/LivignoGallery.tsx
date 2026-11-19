'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Ruler, X } from 'lucide-react';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import type { GalleryImage } from '@/data/galleries';
import styles from './LivignoGallery.module.css';

interface LivignoGalleryProps {
  title: string;
  context?: string;
  area?: number;
  images: GalleryImage[];
  controls?: ReactNode;
  onClose: () => void;
}

export default function LivignoGallery({ title, context, area, images, controls, onClose }: LivignoGalleryProps) {
  const [selectedId, setSelectedId] = useState<string>();
  const [failedSources, setFailedSources] = useState<ReadonlySet<string>>(() => new Set());
  const closeButton = useRef<HTMLButtonElement>(null);
  const selectedThumbnail = useRef<HTMLButtonElement>(null);
  const thumbnailStrip = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const availableImages = images.filter(image => !failedSources.has(image.src));
  const count = availableImages.length;
  const currentIndex = Math.max(availableImages.findIndex(image => image.id === selectedId), 0);
  const photo = availableImages[currentIndex];

  useEffect(() => {
    closeButton.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const strip = thumbnailStrip.current;
    const thumb = selectedThumbnail.current;
    if (!strip || !thumb) return;
    const stripBounds = strip.getBoundingClientRect();
    const thumbBounds = thumb.getBoundingClientRect();
    if (thumbBounds.left < stripBounds.left || thumbBounds.right > stripBounds.right) {
      strip.scrollLeft += (thumbBounds.left + thumbBounds.right - stripBounds.left - stripBounds.right) / 2;
    }
  }, [currentIndex, count]);

  function goBy(step: number) {
    if (count > 1) setSelectedId(availableImages[(currentIndex + step + count) % count].id);
  }

  function skipUnavailable(src: string) {
    setFailedSources(previous => previous.has(src) ? previous : new Set([...previous, src]));
  }

  return (
    <section
      aria-label={title}
      className={styles.viewer}
      onKeyDown={event => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === 'Escape') onClose();
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          goBy(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
    >
      {photo && <img src={photo.src} alt="" aria-hidden="true" className={styles.ambient} />}
      <header className={styles.header}>
        <img className={styles.logo} src="/identity/livigno-logo-negative.png" alt="Livigno 555" />
        <div className={styles.heading}>
          {context && <p>{context}</p>}
          <h1>{title}</h1>
        </div>
        <div className={styles.controls}>
          {!!area && area > 0 && <span className={styles.area}><Ruler size={17} aria-hidden="true" />{area.toFixed(2)} m²</span>}
          {controls}
          <FullScreenToggle className={styles.fullscreen} />
          <button ref={closeButton} className={styles.iconButton} type="button" aria-label="Cerrar galería" onClick={onClose}>
            <X size={23} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className={styles.stage}>
        {count > 1 && (
          <button type="button" className={styles.iconButton} aria-label="Foto anterior" onClick={() => goBy(-1)}>
            <ArrowLeft size={24} aria-hidden="true" />
          </button>
        )}
        {photo ? (
          <figure
            className={styles.frame}
            onTouchStart={event => { touchStart.current = event.touches.length === 1 ? event.touches[0].clientX : null; }}
            onTouchCancel={() => { touchStart.current = null; }}
            onTouchEnd={event => {
              if (touchStart.current === null) return;
              const delta = event.changedTouches[0].clientX - touchStart.current;
              touchStart.current = null;
              if (Math.abs(delta) >= 45) goBy(delta < 0 ? 1 : -1);
            }}
          >
            <img key={photo.id} src={photo.src} alt={photo.alt} draggable={false} className={styles.photo} onError={() => skipUnavailable(photo.src)} />
          </figure>
        ) : <p className={styles.empty}>No hay fotos publicadas.</p>}
        {count > 1 && (
          <button type="button" className={styles.iconButton} aria-label="Foto siguiente" onClick={() => goBy(1)}>
            <ArrowRight size={24} aria-hidden="true" />
          </button>
        )}
      </div>

      {photo && (
        <footer className={styles.tray}>
          <div className={styles.counter}>
            <span>Fotos</span>
            <span aria-live="polite" aria-atomic="true">
              <strong>{String(currentIndex + 1).padStart(2, '0')}</strong> / {String(count).padStart(2, '0')}
            </span>
          </div>
          <div className={styles.thumbnails} ref={thumbnailStrip} aria-label="Miniaturas">
            {availableImages.map((image, position) => {
              const selected = position === currentIndex;
              return (
                <button
                  key={image.id}
                  ref={selected ? selectedThumbnail : undefined}
                  type="button"
                  aria-label={`Ver foto ${position + 1}`}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => setSelectedId(image.id)}
                >
                  <img src={image.src} alt="" loading="lazy" draggable={false} onError={() => skipUnavailable(image.src)} />
                </button>
              );
            })}
          </div>
        </footer>
      )}
    </section>
  );
}
