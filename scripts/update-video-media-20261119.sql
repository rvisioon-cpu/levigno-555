-- Prepared from the live D1 inspection on November 19, 2026.
-- Run only after the replacement video is available in R2.
-- Changes only the exact active VIDEO_SIDEBAR row inspected in production.
UPDATE media SET url = '/api/r2/videos/20261119/livigno-general.mp4'
WHERE id = 'livigno-main-video-20261117'
  AND title = 'Conoce Livigno 555'
  AND category = 'VIDEO_SIDEBAR'
  AND url = '/api/r2/videos/20261117/livigno-general.mp4'
  AND is_active = 1 AND deleted_at IS NULL;
