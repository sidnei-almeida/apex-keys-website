/** Chama o Route Handler local (mesma origem). */

export async function translateToPtBr(
  text: string,
  mode?: "short",
): Promise<{ translated: string; source: string }> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode }),
  });
  const data = (await res.json()) as {
    translated?: string;
    source?: string;
    error?: string;
  };
  if (!res.ok) {
    return { translated: text, source: "original" };
  }
  return {
    translated:
      typeof data.translated === "string" ? data.translated : text,
    source: typeof data.source === "string" ? data.source : "original",
  };
}

export async function translateLabelList(items: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const item of items) {
    const t = item.trim();
    if (!t) continue;
    const { translated } = await translateToPtBr(t, "short");
    out.push(translated);
    await new Promise((r) => setTimeout(r, 220));
  }
  return out;
}
