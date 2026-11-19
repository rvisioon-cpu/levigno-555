-- Exact reverse of update-building-photos-20261119.sql, using inspected live paths.
-- Requires all three ID/name/new-background pairs to match; otherwise changes zero rows.
WITH expected(id, name, old_day, old_night, new_day, new_night) AS (
  VALUES
    (1, 'Cara Central',
     '/building/exterior/20261119/photos/1.1.webp', '/building/exterior/20261119/photos/1.2.webp',
     '/building/exterior/20261119/1.1.webp', '/building/exterior/20261119/1.2.webp'),
    (2, 'Cara Izquierda',
     '/building/exterior/20261119/photos/2.1.webp', '/building/exterior/20261119/photos/2.2.webp',
     '/building/exterior/20261119/2.1.webp', '/building/exterior/20261119/2.2.webp'),
    (3, 'Cara Derecha',
     '/building/exterior/20261119/photos/3.1.webp', '/building/exterior/20261119/photos/3.2.webp',
     '/building/exterior/20261119/3.1.webp', '/building/exterior/20261119/3.2.webp')
)
UPDATE building_faces
SET day_background = (SELECT new_day FROM expected WHERE expected.id = building_faces.id),
    night_background = (SELECT new_night FROM expected WHERE expected.id = building_faces.id)
WHERE deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM expected
    WHERE expected.id = building_faces.id AND expected.name = building_faces.name
      AND expected.old_day = building_faces.day_background
      AND expected.old_night = building_faces.night_background
  )
  AND (SELECT count(*) FROM building_faces AS current_face
       JOIN expected ON expected.id = current_face.id AND expected.name = current_face.name
         AND expected.old_day = current_face.day_background
         AND expected.old_night = current_face.night_background
       WHERE current_face.deleted_at IS NULL) = 3
RETURNING id, name, day_background, night_background;
