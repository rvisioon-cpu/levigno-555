import { latestMedia } from './latest-media';
import { getAssetUrl } from '@/utils/assets';

export const projectVideo = {
  title: 'Conoce Livigno 555',
  src: getAssetUrl(latestMedia.mainVideo),
  poster: getAssetUrl(latestMedia.mainPoster),
};
