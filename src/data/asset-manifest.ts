/**
 * Asset Manifest
 * List all assets that need to be preloaded or are located in the remote storage.
 * This file should be updated whenever new assets are added to the project.
 */
export const assetManifest: string[] = [
    // Identity
    'identity/livigno-logo.png',
    'identity/livigno-logo-negative.png',
    'identity/santa-cruz-logo.png',
    
    // Building Exterior
    'building/photos/face_0_daylight.png',
    'building/photos/face_0_night.png',
    'building/videos/face_0_daylight.mp4',
    
    // Transitions
    'videos/walks/trans_intro_to_0.mp4',
    
    // Floors & Units
    'plants/floor_1.png',
    'plants/details/101/furnished.jpg',
    'plants/details/101/unfurnished.jpg',
    'plants/details/101/plans.jpg',
    
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
