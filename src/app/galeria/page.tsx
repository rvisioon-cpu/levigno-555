'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LivignoGallery from '@/components/gallery/LivignoGallery';
import { galleries } from '@/data/galleries';
import { getPublishedGalleries } from '@/app/actions/galleries';

const amenities = galleries.find(gallery => gallery.id === 'amenities')!;

export default function GalleryPage() {
  const router = useRouter();
  const [published, setPublished] = useState<typeof galleries>([]);
  const [activeId, setActiveId] = useState(amenities.id);

  useEffect(() => {
    let active = true;
    getPublishedGalleries().then(rows => {
      if (active) setPublished(rows);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const currentAmenities = published.find(gallery => gallery.id === amenities.id);
  const visibleGalleries = [
    currentAmenities?.images.length ? currentAmenities : amenities,
    ...published.filter(gallery => gallery.id !== amenities.id && gallery.images.length),
  ];
  const gallery = visibleGalleries.find(item => item.id === activeId) ?? visibleGalleries[0];
  return (
    <LivignoGallery
      key={gallery.id}
      title={gallery.title}
      context="Galería"
      images={gallery.images}
      onClose={() => router.push('/')}
      controls={visibleGalleries.length > 1 && (
        <select
          aria-label="Cambiar galería"
          className="max-w-36 rounded-md border border-livigno-sand/40 bg-livigno-teal px-2 py-1 text-xs text-white"
          value={gallery.id}
          onChange={event => setActiveId(event.target.value)}
        >
          {visibleGalleries.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      )}
    />
  );
}
