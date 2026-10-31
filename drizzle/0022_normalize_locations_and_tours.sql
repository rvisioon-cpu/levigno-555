UPDATE locations_poi SET category = 'Lifestyle' WHERE category = 'lifestyle';
UPDATE locations_poi SET category = 'Comercio' WHERE category = 'comercio';
UPDATE locations_poi SET category = 'Educación' WHERE category IN ('educación', 'educacion');
UPDATE locations_poi SET category = 'Áreas verdes y Recreación' WHERE category IN ('áreas verdes y recreación', 'areas verdes y recreacion');
UPDATE tours SET "order" = 0 WHERE id = 'building-main';
UPDATE tours SET thumbnail_url = '/amenities/2.webp' WHERE id = 'building-main';
UPDATE tours SET thumbnail_url = replace(thumbnail_url, 'furnished.jpg', 'gallery/1.jpg') WHERE type = 'unit';
