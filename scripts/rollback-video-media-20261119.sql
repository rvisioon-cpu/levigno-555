-- Exact reverse of update-video-media-20261119.sql, using the original live URL.
-- Only reverts the inspected row if it still points at this replacement.
UPDATE media SET url = '/api/r2/videos/20261117/livigno-general.mp4'
WHERE id = 'livigno-main-video-20261117'
  AND title = 'Conoce Livigno 555'
  AND category = 'VIDEO_SIDEBAR'
  AND url = '/api/r2/videos/20261119/livigno-general.mp4'
  AND is_active = 1 AND deleted_at IS NULL;
