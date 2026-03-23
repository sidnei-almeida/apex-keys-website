/**
 * Tradução EN → pt-BR via MyMemory (sem API key; quota gratuita limitada).
 * Usado só no servidor (Route Handler) para evitar CORS.
 */

const MM = "https://api.mymemory.translated.net/get";

export type TranslateResult = {
  translated: string;
  ok: boolean;
};

export async function translateWithMyMemory(
  text: string,
  langpair = "en|pt-BR",
): Promise<TranslateResult> {
  const q = text.trim().slice(0, 480);
  if (!q) return { translated: "", ok: true };
  const url = `${MM}?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(langpair)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return { translated: text, ok: false };
  }
  const data = (await res.json()) as {
    responseStatus?: number;
    responseData?: { translatedText?: string };
    responseDetails?: string;
  };
  if (data.responseStatus !== 200) {
    return { translated: text, ok: false };
  }
  const out = data.responseData?.translatedText?.trim();
  return { translated: out || text, ok: Boolean(out) };
}

/** Partes longas: vários pedidos com pausa para não estourar quota. */
export async function translateLongTextToPtBr(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const max = 380;
  const chunks: string[] = [];
  let i = 0;
  while (i < trimmed.length) {
    let end = Math.min(i + max, trimmed.length);
    if (end < trimmed.length) {
      const sub = trimmed.slice(i, end);
      const lb = Math.max(sub.lastIndexOf(". "), sub.lastIndexOf("\n"));
      if (lb > 80) end = i + lb + 1;
    }
    const piece = trimmed.slice(i, end).trim();
    if (piece) chunks.push(piece);
    i = end;
  }
  const parts: string[] = [];
  for (const c of chunks) {
    const { translated, ok } = await translateWithMyMemory(c);
    parts.push(ok ? translated : c);
    await new Promise((r) => setTimeout(r, 280));
  }
  return parts.join("\n\n").trim();
}
