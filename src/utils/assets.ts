export const ASSET_BASE_URL = process.env.NEXT_PUBLIC_ASSET_BASE_URL || '';

export const getAssetUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  // Ensure path doesn't start with slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const hashIndex = cleanPath.indexOf('#');
  const urlWithoutHash = hashIndex < 0 ? cleanPath : cleanPath.slice(0, hashIndex);
  const hash = hashIndex < 0 ? '' : cleanPath.slice(hashIndex);
  const version = urlWithoutHash.startsWith('plants/') && !/(?:[?&])v=/.test(urlWithoutHash) ? `${urlWithoutHash.includes('?') ? '&' : '?'}v=20261030` : '';
  return `${ASSET_BASE_URL}/${urlWithoutHash}${version}${hash}`;
};

export { assetManifest } from '../data/asset-manifest';

export const getCanvasImageUrl = (path: string): string => {
  if (!path || /^(data:|blob:|https?:|\/api\/)/.test(path)) return path;
  return `/api/r2/${path.replace(/^\//, "")}`;
};
