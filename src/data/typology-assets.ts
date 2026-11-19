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

export const typologyGalleryAssetRoot = (assetId: string) =>
  typologyAssetRoot(assetId === 'T17' ? 'T8' : assetId);

export const replacementPlanAssets = [...replacementPlanTypes].flatMap(type => {
  const root = typologyPlanAssetRoot(type);
  return replacementPlanViews.flatMap(from => [
    `${root}/${from}.webp`,
    ...replacementPlanViews.filter(to => to !== from)
      .map(to => `${root}/transitions/${from}_to_${to}.mp4`),
  ]);
});
