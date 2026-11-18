-- Vincular iconos existentes en public/icons/ a ubicaciones que tenían image_path NULL
UPDATE locations_poi SET image_path = 'icons/COMERCIO/plaza_vea.png' WHERE id = '560a0e5bbd88889185d737482a69726f' AND image_path IS NULL;
UPDATE locations_poi SET image_path = 'icons/COMERCIO/mass_1.png' WHERE id = '4efc0b83e504c1c5764f29305312204d' AND image_path IS NULL;
UPDATE locations_poi SET image_path = 'icons/LIFESTYLE/estadio.png' WHERE id = '87ca9a7d3ac493548fbdb013c6671cc0' AND image_path IS NULL;
UPDATE locations_poi SET image_path = 'icons/LIFESTYLE/estadio.png' WHERE id = 'a23e3bd2e385f37e69a79dd93bce12f3' AND image_path IS NULL;
UPDATE locations_poi SET image_path = 'icons/AREAS_VERDES_Y_RECREACION/logo_parque.png' WHERE id = 'c4fcc1cebf9642ad1f00a87be95b18e1' AND image_path IS NULL;
UPDATE locations_poi SET image_path = 'icons/EDUCACION/colegio_1.png' WHERE id = 'c74a20fedea327c86449c55735c074c1' AND image_path IS NULL;
UPDATE locations_poi SET image_path = 'icons/EDUCACION/colegio_2.png' WHERE id = 'f8b7bb796590f99eaa9833ce005c574f' AND image_path IS NULL;
UPDATE locations_poi SET image_path = 'icons/SALUD_Y_BIENESTAR/hospital.png' WHERE id = '39585dbcc61d94d1a76ec4c56009f693' AND image_path IS NULL;
UPDATE locations_poi SET image_path = 'icons/SALUD_Y_BIENESTAR/hospital.png' WHERE id = '8750d8a3dc608e5d1464434b46897e91' AND image_path IS NULL;
