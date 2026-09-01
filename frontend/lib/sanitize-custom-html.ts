/** Plantillas ORZEN (y similares) publican documentos HTML completos.
 *  Insertarlos con innerHTML dentro de un <div> rompe el parsing y deja SVG
 *  sueltos (lupa/corazón) visibles sin CSS. */
export function sanitizeCustomHtml(html: string): string {
  if (!html) return html;
  let out = html.trim();
  if (!/^<!DOCTYPE/i.test(out) && !/<html[\s>]/i.test(out)) return out;

  const bodyMatch = out.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  out = bodyMatch
    ? bodyMatch[1]
    : out.replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '');
  out = out.replace(/<head[\s\S]*?<\/head>/gi, '');
  out = out.replace(/<\/?html[^>]*>/gi, '');
  out = out.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
  return out.trim();
}
