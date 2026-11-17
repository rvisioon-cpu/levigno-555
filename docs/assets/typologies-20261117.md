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
- Las tipologías actualizadas usan temporalmente 2 habitaciones y 2 baños.
- Se conservan las áreas anteriores por unidad. Las nuevas unidades 1403, 1503 y 1603 quedan con área por confirmar.
- T1 cubre 201–1301; T10 cubre 1401–1501; T11 corresponde a 1402; T12 a 1403–1503; T13 a 1502; T14 al dúplex 1601; T15 a 1602 y T16 a 1603.
- Se conservan los archivos originales de T2, T3, T5, T6 y T8.
- Los pisos 14–16 muestran pines dentro de cada unidad mientras se trazan sus nuevos polígonos con el selector de coordenadas.

## Corrección de nombres de transiciones

En T10, `T2 - 02_CAD_a_A_1.mp4` empieza en la vista amoblada, por lo que se asigna a `furnished_to_plans.mp4`. El archivo 05 empieza en CAD y se asigna a `plans_to_furnished.mp4`. Se inspeccionaron los primeros fotogramas para resolver la etiqueta duplicada del material fuente.
