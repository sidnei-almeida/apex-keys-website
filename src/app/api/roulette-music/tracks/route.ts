import { readdir } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

/**
 * Lista ficheiros `.mp3` em `public/music` para o cliente usar URLs corretas
 * (`/music/nome.mp3`), sem depender de nomes fixos que não existam no disco.
 */
export async function GET() {
  const dir = path.join(process.cwd(), "public", "music");
  try {
    const files = await readdir(dir);
    const mp3 = files
      .filter((f) => f.toLowerCase().endsWith(".mp3"))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    const tracks = mp3.map((f) => `/music/${encodeURIComponent(f)}`);
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ tracks: [] as string[] });
  }
}
