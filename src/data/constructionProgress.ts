export interface ProgressUpdate {
  id: string;
  date: string; // e.g. "Mayo 2024"
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
}

export const constructionProgress: ProgressUpdate[] = [];
