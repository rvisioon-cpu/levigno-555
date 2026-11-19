-- Read-only inspection before applying the November 19 exterior assets.
SELECT * FROM building_faces WHERE deleted_at IS NULL ORDER BY "order";

SELECT id, config, updated_at FROM global_settings
WHERE id IN ('site_homepage', 'site_building_opening');

SELECT id, title, url, category, is_active, created_at, deleted_at FROM media
WHERE deleted_at IS NULL AND (
  category IN ('VIDEO_PORTADA', 'VIDEO_SIDEBAR')
  OR (category IN ('AMENITIES_GALLERY', 'amenities')
      AND url LIKE '%/20261119/10.webp')
);
