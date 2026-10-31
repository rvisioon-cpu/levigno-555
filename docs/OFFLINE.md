# Modo Offline — Livigno 555 Showroom Virtual

Permite descargar y ejecutar el showroom completo de **Livigno 555** sin conexión a internet, pensado para presentaciones comerciales en salas de venta, casetas y ferias donde la conectividad sea deficiente o nula.

---

## 1. Filosofía de diseño

- **Descarga previa, no al vuelo:** El showroom completo contiene más de 1.3 GB de imágenes de alta resolución, videos de fachada (día/noche), planos y tipologías. La preparación se realiza **antes** de la presentación (oficina o con buena conexión) a través de la pantalla `/preparar`.
- **Ejecución en Pestaña (Window):** La descarga ocurre en el hilo principal del cliente y no en el Service Worker, ya que los navegadores detienen workers inactivos tras ~30 segundos, lo que interrumpiría descargas de gran volumen.
- **Service Worker de Sólo Lectura:** `public/sw.js` se limita a responder peticiones sirviendo desde las cachés locales.

---

## 2. Arquitectura y Componentes

| Componente | Archivo | Responsabilidad |
|---|---|---|
| **Manifiesto** | `scripts/build-precache-manifest.ts` | Recorre el grafo de datos (`src/data/`), mide tamaños y genera `public/precache-manifest.json`. |
| **Descarga y Shell** | `src/utils/offline.ts` | Administra la descarga concurrente (6 workers), persistencia de disco y calentamiento de rutas/chunks dinámicos. |
| **Pantalla de Preparación** | `src/app/preparar/page.tsx` | UI para el presentador con barra de progreso en vivo, velocidad en MB/s y tiempo restante. |
| **Service Worker** | `public/sw.js` | Responde con estrategia *Network-First (timeout 4s)* para HTML y *Cache-First* para media con síntesis de respuestas `206 Partial Content`. |
| **Registrador** | `src/components/layout/ServiceWorkerRegistrar.tsx` | Registra el worker en producción (o en dev con `?offline=1`). |
| **CORS R2** | `r2-cors.json` | Configuración de CORS requerida en el bucket de Cloudflare R2. |

---

## 3. Cachés y División de Tiers

Las cachés están separadas para no invalidar medios pesados ante actualizaciones de código:
- **`livigno-shell-v1`**: HTML de rutas, fuentes, bundles de JavaScript (`/_next/static/`), iconos y estilos.
- **`livigno-media-v1`**: Videos `.mp4`, renders `.webp`, planos de plantas y tipologías.

### Tiers de Descarga
1. **`critical` (Recorrido Principal):**
   - Portada y hero
   - Fachadas de día y loops base (0.1, 0.2, 1.1, 2.1, 3.1)
   - Planos de plantas 1 a 17 y sótanos s1 a s3
   - Planos y vistas de tipologías T1 a T12 (amoblado, desamoblado, planos)
   - Logotipos e identidad visual
2. **`full` (Material Completo):**
   - Fachadas nocturnas
   - Galerías de fotos de amenidades y departamentos
   - Transiciones de video entre estados
   - Videos generales y de entorno

---

## 4. Soporte para Videos y Rangos (HTTP 206)

Las etiquetas HTML5 `<video>` solicitan fragmentos de archivo con la cabecera `Range: bytes=...`. La API `CacheStorage` de los navegadores únicamente guarda respuestas `200 OK` completas.

`public/sw.js` intercepta peticiones que contienen cabecera `Range`, recorta el buffer en memoria y devuelve una respuesta con estado `206 Partial Content` y cabeceras `Content-Range: bytes ${start}-${end}/${total}`, permitiendo reproducción y scrubbing fluido en Safari y Chrome sin conexión.

---

## 5. Comandos útiles

```bash
# Generar manifiesto con pesos locales / cacheados
npm run offline:manifest

# Volver a medir tamaños contra R2 y actualizar .precache-sizes.json
npm run offline:manifest:measure
```
