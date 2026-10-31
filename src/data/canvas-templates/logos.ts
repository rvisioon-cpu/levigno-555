/** Logos aprobados para las plantillas DOM.
 *
 * Los archivos viven en `public/content/templates/logos`. Se mantiene esta
 * lista explícita para que el bundle no dependa de enumerar el filesystem en
 * producción y para que sólo se puedan seleccionar assets revisados.
 */
export const TEMPLATE_LOGOS = [
  { id: "full-black", label: "Logo negro", src: "/content/templates/logos/logo_full_black.png" },
  { id: "full-white", label: "Logo blanco", src: "/content/templates/logos/logo_full_white.png" },
  { id: "isotipo", label: "Isotipo", src: "/content/templates/logos/logo_isotipo.png" }
] as const;

