/**
 * Asset Manifest
 * List all assets that need to be preloaded or are located in the remote storage.
 * This file should be updated whenever new assets are added to the project.
 */
export const assetManifest: string[] = [
    // Homepage
    'homepage/portada.webp',
    'videos/portada.mp4',
    'videos/livigno-general.mp4',
    // Identity
    'identity/livigno-logo.png',
    'identity/livigno-logo-negative.png',
    'identity/santa-cruz-kayen-white.png',
    'identity/santa-cruz-kayen-color.png',
    'identity/santa-cruz-kayen-black.png',
    
    // Building Exterior
    'building/photos/face_0_daylight.png',
    'building/photos/face_0_night.png',
    'building/videos/face_0_daylight.mp4',
    
    // Transitions
    'videos/walks/trans_intro_to_0.mp4',
    
    // Floors & Units
    ...Array.from({ length: 17 }, (_, index) => `plants/floor_${index + 1}.png`),
    ...[1, 2, 3].map((level) => `plants/floor_s${level}.png`),
    ...Array.from({ length: 12 }, (_, index) => {
        const type = `T${index + 1}`;
        return [
            `plants/details/${type}/plans.jpg`,
            ...(index < 3 ? [
                `plants/details/${type}/furnished.jpg`,
                `plants/details/${type}/gallery/0.jpg`,
                ...Array.from({ length: [10, 7, 7][index] }, (_, imageIndex) => `plants/details/${type}/gallery/${imageIndex + 1}.jpg`),
            ] : []),
        ];
    }).flat(),
    
    // Gallery
    'gallery/exterior_1.jpg',
    'gallery/interior_lobby.jpg',
    // Map introduction and hito media
    'videos/premapa.mp4',
    'icons/PROYECTO/logo_proyecto.png',
    'icons/EDUCACION/logo_pucp.png',
    'icons/COMERCIO/logo_plazasm.png',
    'icons/COMERCIO/logo_openplaza.png',
    'icons/AREAS_VERDES_Y_RECREACION/logo_parque.png',
    'icons/LIFESTYLE/logo_arena1.png',
    ...['pucp', 'plaza-san-miguel', 'parque-de-las-leyendas', 'open-plaza', 'arena-1'].flatMap((slug) => [
        `location/videos/hitos/${slug}/full.mp4`,
        `location/videos/hitos/${slug}/preview.mp4`,
        `location/videos/hitos/${slug}/poster.jpg`,
    ]),
];
