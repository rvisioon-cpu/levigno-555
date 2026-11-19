export const amenityPhotos = [
  { path: 'amenities/20261119/1.webp', title: 'Fachada aérea' },
  { path: 'amenities/20261119/2.webp', title: 'Vista exterior' },
  { path: 'amenities/20261119/3.webp', title: 'Ingreso principal' },
  { path: 'amenities/20261119/5.webp', title: 'Lobby' },
  { path: 'amenities/20261119/6.webp', title: 'Plaza interior' },
  { path: 'amenities/20261119/7.webp', title: 'Gimnasio' },
  { path: 'amenities/20261119/coworking.webp', title: 'Coworking' },
  { path: 'amenities/20261119/9.webp', title: 'Juegos infantiles' },
  { path: 'amenities/20261119/10.webp', title: 'Petshower' },
  { path: 'amenities/20261119/11.webp', title: 'SUM' },
  { path: 'amenities/20261119/12.webp', title: 'Zona de parrillas' },
  { path: 'amenities/20261119/13.webp', title: 'Bike Zone' },
];

// Versioned keys keep updated media from reusing cached files.
export const latestMedia = {
  introVideo: 'videos/20261119/portada.mp4',
  introPoster: 'homepage/20261119/portada.webp',
  mainVideo: 'videos/20261117/livigno-general.mp4',
  mainPoster: 'videos/20261117/livigno-general-poster.webp',
  amenities: amenityPhotos.map(photo => photo.path),
};
