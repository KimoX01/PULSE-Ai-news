/* ── Stable ID ────────────────────────────────────────────────────
   Java-style 31-multiplier hash over the input string.
   Two independent hash words reduce collision probability vs a
   single 32-bit value.
─────────────────────────────────────────────────────────────── */
export function stableId(s: string): string {
  let h1 = 0x9dc5_811c, h2 = 0x1c4b_3c7f;
  for (let i = 0; i < s.length; i++) {
    h1 = (Math.imul(31, h1) + s.charCodeAt(i)) | 0;
    h2 = (Math.imul(37, h2) ^ s.charCodeAt(i)) | 0;
  }
  return (Math.abs(h1) * 0x1_0000_0000 + Math.abs(h2)).toString(36);
}

/* ── HTML entity decoder ──────────────────────────────────────── */
const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
  "&#8216;": "'", "&#8217;": "'", "&#8220;": '"', "&#8221;": '"',
  "&#8211;": "–", "&#8212;": "—", "&#8230;": "…", "&nbsp;": " ",
  "&#39;": "'", "&#x27;": "'",
};

export function decodeEntities(str: string): string {
  return str.replace(/&#?\w+;/g, (m) => HTML_ENTITIES[m] ?? m);
}
