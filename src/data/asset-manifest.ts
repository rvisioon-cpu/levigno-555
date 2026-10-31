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
    ...Array.from({ length: 17 }, (_, index) => `plants/floor_${index + 1}.jpg`),
    ...[1, 2, 3].map((level) => `plants/floor_s${level}.jpg`),
    ...Array.from({ length: 12 }, (_, index) => {
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
        if (type === 'T12') {
            assets.push(
                'plants/details/T12/plans_2floor.webp',
                'plants/details/T12/furnished_2floor.webp',
                'plants/details/T12/unfurnished_2floor.webp',
                'plants/details/T12/deliverable_2floor.webp',
                'plants/details/T12/plans_2floor.jpg',
                'plants/details/T12/furnished_2floor.jpg',
                'plants/details/T12/deliverable_2floor.jpg',
                ...transitions.map((transition) => `plants/details/T12/transitions/${transition}_2floor.mp4`),
                ...transitions.map((transition) => `plants/details/T12/transitions/${transition}_1floor.mp4`),
            );
        }
        return assets;
    }).flat(),
    
    // Gallery
    'gallery/exterior_1.jpg',
    'gallery/interior_lobby.jpg',
    ...Array.from({ length: 8 }, (_, index) => `amenities/${index + 1}.webp`),
    'amenities/P1.webp',
    ...Array.from({ length: 20 }, (_, index) => `amenities/P${index + 4}.webp`),
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
