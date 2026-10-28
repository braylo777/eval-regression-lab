export interface Chunk { ord: number; section: string | null; body: string }

/** Split governing-document text into section-aware chunks of roughly maxChars. */
export function chunkText(text: string, maxChars = 700): Chunk[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: Chunk[] = [];
  let section: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    const body = buf.join(" ").replace(/\s+/g, " ").trim();
    if (body) out.push({ ord: out.length, section, body });
    buf = [];
  };
  const isHeading = (l: string) =>
    /^#{1,6}\s+/.test(l) || /^(article|section|§)\s*[\divxlc.]+/i.test(l.trim());
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) { if (buf.join(" ").length > maxChars * 0.6) flush(); continue; }
    if (isHeading(l)) { flush(); section = l.replace(/^#+\s*/, ""); continue; }
    for (const sentence of l.split(/(?<=[.;:])\s+/)) {
      if (buf.join(" ").length + sentence.length > maxChars) flush();
      buf.push(sentence);
    }
  }
  flush();
  return out;
}
