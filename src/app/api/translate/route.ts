import { NextResponse } from "next/server";
import {
  translateLongTextToPtBr,
  translateWithMyMemory,
} from "@/lib/translate/mymemory";

const MAX_BODY_CHARS = 12_000;

/**
 * POST { text: string, mode?: "short" }
 * — "short": frases curtas (rótulos IGDB); default: texto longo (resumo).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }
  const text =
    typeof (body as { text?: unknown }).text === "string"
      ? (body as { text: string }).text.trim()
      : "";
  if (!text) {
    return NextResponse.json({ error: "text obrigatório" }, { status: 400 });
  }
  if (text.length > MAX_BODY_CHARS) {
    return NextResponse.json({ error: "texto demasiado longo" }, { status: 400 });
  }
  const mode = (body as { mode?: unknown }).mode;

  try {
    if (mode === "short") {
      const { translated, ok } = await translateWithMyMemory(text.slice(0, 200));
      return NextResponse.json({
        translated,
        source: ok ? "mymemory" : "original",
      });
    }
    const translated = await translateLongTextToPtBr(text);
    return NextResponse.json({
      translated,
      source: "mymemory",
    });
  } catch {
    return NextResponse.json({
      translated: text,
      source: "original",
    });
  }
}
