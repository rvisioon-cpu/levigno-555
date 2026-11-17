# Actualización de tipologías — 17 de noviembre de 2026

Material preparado en `plants/details/20261117/` para conservar los archivos que usa la versión publicada y permitir que las nuevas referencias convivan con los archivos anteriores.

| Tipología del ZIP | Unidades indicadas | Galería | Transiciones |
| --- | --- | ---: | ---: |
| T1 | 201–1301 | 10 | 6 |
| T7 | 1202 | 7 | 6 |
| T9 | 1302 | 7 | 6 |
| T10 | 1401–1501 | 9 | 6 |
| T11 | 1402 | 9 | 6 |
| T12 | 1403–1503 | 5 | 6 |
| T13 | 1502 | 7 | 6 |
| T14 | Dúplex 1601 | 13 | 12 |
| T15 | 1602 | 6 | 6 |
| T16 | 1603 | 6 | 6 |

Total: 178 archivos (33 planos y vistas, 79 imágenes de galería, 66 transiciones). Las imágenes se convierten a WebP con calidad 88, conservando la resolución; los MP4 se copian sin recodificar. El JSON adjunto registra cada archivo fuente y su clave de destino. T13 se incluye por confirmación del usuario.

## Reproducción

Extraer los ZIP en una carpeta temporal y ejecutar:

```sh
node scripts/import-typologies.mjs /ruta/a/carpetas-extraidas
npm run assets:upload-typologies
```

Usar la cuenta de Cloudflare que contiene `levigno-assets`. Los activos locales están excluidos de Git según la configuración existente del proyecto.

## Catálogo confirmado

- La segunda aparición de «FLAT 203» corresponde a T8 / 1203–1303.
- T13 / 1502 también se actualiza con el ZIP entregado.
- Cuadro confirmado: T1 73.52 m² / 3 dormitorios / 2 baños; T7 54.18 / 3 / 2; T9 53.61 / 2 / 1; T10 50.24 / 2 / 2; T11 63.50 / 2 / 2; T12 44.28 / 1 / 1; T13 56.77 / 2 / 2; T14 101.38 (66.20 + 35.18) / 4 / 2.5; T15 39.80 / 1 / 1; T16 40.22 / 1 / 1.
- Estos valores prevalecen sobre los datos anteriores del panel. Las tipologías no incluidas en este cuadro conservan sus datos.
- T1 cubre 201–1301; T10 cubre 1401–1501; T11 corresponde a 1402; T12 a 1403–1503; T13 a 1502; T14 al dúplex 1601; T15 a 1602 y T16 a 1603.
- Se conservan los archivos originales de T2, T3, T5, T6 y T8.
- Los pisos 14–17 usan los polígonos entregados por el usuario: 1401/1501 y 1403/1503 comparten sus respectivos contornos; 1402, 1502, 1602 y 1603 tienen contornos propios; el dúplex 1601 tiene un contorno independiente para cada nivel.

## Corrección de nombres de transiciones

En T10, `T2 - 02_CAD_a_A_1.mp4` empieza en la vista amoblada, por lo que se asigna a `furnished_to_plans.mp4`. El archivo 05 empieza en CAD y se asigna a `plans_to_furnished.mp4`. Se inspeccionaron los primeros fotogramas para resolver la etiqueta duplicada del material fuente.
