export interface Landmark {
  slug: string;
  name: string;
  category: string;
  coordinates: [number, number];
  poster: string;
  preview: string;
  video: string;
  poiName: string;
}

const asset = (slug: string, filename: string) => `location/videos/hitos/${slug}/${filename}`;

/**
 * DEFINICIÓN ORIGINAL DE HITOS:
 * -------------------------------------------------------------
 * NOTA TEMPORAL:
 * Los 5 puntos correspondientes a hitos (PUCP, Plaza San Miguel, Parque de las Leyendas,
 * Open Plaza La Marina y Arena 1) han sido deshabilitados temporalmente como hitos para que
 * se muestren en el mapa como puntos normales utilizando los iconos disponibles en el proyecto.
 *
 * Se conserva esta lista intacta ya que RETORNARÁN A SER HITOS POSTERIORMENTE.
 * Para reactivarlos como hitos, simplemente asignar:
 * export const landmarks: Landmark[] = originalLandmarks;
 * -------------------------------------------------------------
 */
export const originalLandmarks: Landmark[] = [
  {
    slug: 'pucp', name: 'Pontificia Universidad Católica del Perú', category: 'Educación',
    coordinates: [-77.080142, -12.069353], poiName: 'Pontificia Universidad Católica del Perú',
    poster: asset('pucp', 'poster-livigno.jpg'), preview: asset('pucp', 'preview-livigno.mp4'), video: asset('pucp', 'full-livigno.mp4'),
  },
  {
    slug: 'plaza-san-miguel', name: 'Plaza San Miguel', category: 'Comercio',
    coordinates: [-77.082718, -12.077654], poiName: 'Plaza San Miguel',
    poster: asset('plaza-san-miguel', 'poster-livigno.jpg'), preview: asset('plaza-san-miguel', 'preview-livigno.mp4'), video: asset('plaza-san-miguel', 'full-livigno.mp4'),
  },
  {
    slug: 'parque-de-las-leyendas', name: 'Parque de las Leyendas', category: 'Áreas verdes y recreación',
    coordinates: [-77.087057, -12.071448], poiName: 'Parque de las Leyendas',
    poster: asset('parque-de-las-leyendas', 'poster-livigno.jpg'), preview: asset('parque-de-las-leyendas', 'preview-livigno.mp4'), video: asset('parque-de-las-leyendas', 'full-livigno.mp4'),
  },
  {
    slug: 'open-plaza', name: 'Open Plaza La Marina', category: 'Comercio',
    coordinates: [-77.088707, -12.07962], poiName: 'CC Open Plaza',
    poster: asset('open-plaza', 'poster-livigno.jpg'), preview: asset('open-plaza', 'preview-livigno.mp4'), video: asset('open-plaza', 'full-livigno.mp4'),
  },
  {
    slug: 'arena-1', name: 'Arena 1 San Miguel', category: 'Lifestyle',
    coordinates: [-77.089501, -12.090826], poiName: 'Arena 1',
    poster: asset('arena-1', 'poster-livigno.jpg'), preview: asset('arena-1', 'preview-livigno.mp4'), video: asset('arena-1', 'full-livigno.mp4'),
  },
];

// Hitos activos para Livigno
export const landmarks: Landmark[] = originalLandmarks;

export const landmarkPoiNames = new Set(landmarks.map((landmark) => landmark.poiName.toLowerCase().trim()));
