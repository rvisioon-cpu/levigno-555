import { amenityPhotos } from './latest-media';
import { getAssetUrl } from '@/utils/assets';

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  highlightUrl?: string;
}

export interface GalleryCollection {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  folderPrefix?: string;
  images: GalleryImage[];
}

export const galleries: GalleryCollection[] = [
  {
    id: 'general',
    title: 'General',
    description: 'A glimpse into the Showroom Virtual experience.',
    coverImage: 'https://placehold.co/600x400/1a1a1a/ffffff?text=General+Cover',
    images: [] // Expected to be populated at runtime or manually
  },
  {
    id: 'amenities',
    title: 'Amenidades',
    description: 'Áreas comunes de Livigno 555.',
    coverImage: getAssetUrl(amenityPhotos[0].path),
    images: amenityPhotos.map(({ path, title }) => ({
      id: path,
      src: getAssetUrl(path),
      alt: title,
      title,
    }))
  },
  {
    id: 'floor-1',
    title: 'Floor 1',
    description: 'Detailed view of the first floor layout.',
    coverImage: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Floor+1+Cover',
    images: []
  }
];
