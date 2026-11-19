import { updatedTypologyAssets } from './updated-typology-assets';

const updatedTypes = new Set(updatedTypologyAssets.map(path => path.split('/')[3]));
export const hasUpdatedTypology = (assetId?: string) => !!assetId && updatedTypes.has(assetId);
export const typologyAssetRoot = (assetId: string) =>
  `plants/details/${hasUpdatedTypology(assetId) ? '20261117/' : ''}${assetId}`;

const replacementPlanTypes = new Set(['T2', 'T3', 'T5', 'T6', 'T8', 'T17']);
const replacementPlanViews = ['furnished', 'plans', 'unfurnished'];
const replacementPlanRoot = 'plants/details/20261119';

export const typologyPlanAssetRoot = (assetId: string) =>
  replacementPlanTypes.has(assetId) ? `${replacementPlanRoot}/${assetId}` : typologyAssetRoot(assetId);

const replacementGalleryCounts: Readonly<Record<string, number | undefined>> = {
  T2: 7, T3: 6, T5: 6, T6: 7, T8: 5, T17: 5,
};

export const typologyGalleryAssetRoot = (assetId: string) =>
  replacementGalleryCounts[assetId] ? typologyPlanAssetRoot(assetId) : typologyAssetRoot(assetId);

export const typologyGalleryThumbnail = (assetId: string) => {
  const extension = replacementGalleryCounts[assetId] || hasUpdatedTypology(assetId) ? 'webp' : 'jpg';
  return `${typologyGalleryAssetRoot(assetId)}/gallery/1.${extension}`;
};

export const replacementGalleryAssets = Object.entries(replacementGalleryCounts).flatMap(([type, count]) =>
  Array.from({ length: count ?? 0 }, (_, index) => `${typologyGalleryAssetRoot(type)}/gallery/${index + 1}.webp`),
);

export const replacementPlanAssets = [...replacementPlanTypes].flatMap(type => {
  const root = typologyPlanAssetRoot(type);
  return replacementPlanViews.flatMap(from => [
    `${root}/${from}.webp`,
    ...replacementPlanViews.filter(to => to !== from)
      .map(to => `${root}/transitions/${from}_to_${to}.mp4`),
  ]);
});
