import { updatedTypologyAssets } from './updated-typology-assets';

const updatedTypes = new Set(updatedTypologyAssets.map(path => path.split('/')[3]));
export const hasUpdatedTypology = (assetId?: string) => !!assetId && updatedTypes.has(assetId);
export const typologyAssetRoot = (assetId: string) =>
  `plants/details/${hasUpdatedTypology(assetId) ? '20261117/' : ''}${assetId}`;
