import { latestMedia } from './latest-media';
import { updatedTypologyAssets } from './updated-typology-assets';
import { replacementGalleryAssets, replacementPlanAssets } from './typology-assets';

/**
 * Asset Manifest
 * List all assets that need to be preloaded or are located in the remote storage.
 * This file should be updated whenever new assets are added to the project.
 */
export const assetManifest: string[] = [
    // Homepage
    latestMedia.introPoster,
    latestMedia.introVideo,
    latestMedia.mainVideo,
    latestMedia.mainPoster,
    // Identity
    'identity/livigno-logo.png',
    'identity/livigno-logo-negative.png',
    'identity/livigno-logo-tight.png',
    'identity/santa-cruz-kayen-white.png',
    'identity/santa-cruz-kayen-color.png',
    'identity/santa-cruz-kayen-black.png',
    
    // Building to floor 17: all three faces, day and night.
    ...[1, 2, 3].flatMap(face => [1, 2].map(time => `building/exterior/20261117/${face}.${time}-up.mp4`)),

    // Building Exterior
    'building/exterior/0.2.loop.mp4',
    'building/exterior/0.2.jpg',
    'building/photos/face_0_daylight.png',
    'building/photos/face_0_night.png',
    'building/videos/face_0_daylight.mp4',
    
    // Transitions
    'videos/walks/trans_intro_to_0.mp4',
    
    // Floors & Units
    ...Array.from({ length: 17 }, (_, index) => `plants/floor_${index + 1}.jpg`),
    ...[1, 2, 3].map((level) => `plants/floor_s${level}.jpg`),
    ...updatedTypologyAssets,
    ...replacementPlanAssets,
    ...replacementGalleryAssets,
    ...[2, 3, 5, 6, 8].flatMap((number) => {
        const index = number - 1;
        const type = `T${index + 1}`;
        const galleryCounts = [10, 7, 7, 10, 6, 7, 7, 7, 7, 9, 7, 14];
        const transitions = [
            'furnished_to_unfurnished',
            'unfurnished_to_furnished',
            'furnished_to_plans',
            'plans_to_furnished',
            'plans_to_unfurnished',
            'unfurnished_to_plans',
        ];
        const assets = [
            `plants/details/${type}/plans.webp`,
            `plants/details/${type}/furnished.webp`,
            `plants/details/${type}/unfurnished.webp`,
            `plants/details/${type}/deliverable.webp`,
            `plants/details/${type}/plans.jpg`,
            `plants/details/${type}/furnished.jpg`,
            `plants/details/${type}/unfurnished.jpg`,
            `plants/details/${type}/deliverable.jpg`,
            ...Array.from({ length: galleryCounts[index] }, (_, imageIndex) => [
                `plants/details/${type}/gallery/${imageIndex + 1}.webp`,
                `plants/details/${type}/gallery/${imageIndex + 1}.jpg`,
            ]).flat(),
            ...transitions.map((transition) => `plants/details/${type}/transitions/${transition}.mp4`),
        ];
        return assets;
    }),
    
    // Gallery
    'gallery/exterior_1.jpg',
    'gallery/interior_lobby.jpg',
    ...latestMedia.amenities,
    'amenities/20261117/2.webp', // Recorridos thumbnail
    // Map introduction and hito media
    'videos/premapa.mp4',
    'icons/PROYECTO/logo_proyecto.png',
    'icons/EDUCACION/logo_pucp.png',
    'icons/COMERCIO/logo_plazasm.png',
    'icons/COMERCIO/logo_openplaza.png',
    'icons/AREAS_VERDES_Y_RECREACION/logo_parque.png',
    'icons/LIFESTYLE/logo_arena1.png',
    ...['pucp', 'plaza-san-miguel', 'parque-de-las-leyendas', 'open-plaza', 'arena-1'].flatMap((slug) => [
        `location/videos/hitos/${slug}/full-livigno.mp4`,
        `location/videos/hitos/${slug}/preview-livigno.mp4`,
        `location/videos/hitos/${slug}/poster-livigno.jpg`,
    ]),
];
