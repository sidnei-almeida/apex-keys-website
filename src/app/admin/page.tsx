"use client";

import {
  ArrowLeft,
  Loader2,
  Play,
  Plus,
  Search,
  ShieldAlert,
  Target,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-apex-surface bg-apex-bg px-3 py-2.5 text-apex-text placeholder:text-gray-500 focus:border-apex-accent focus:outline-none";

type MockRaffle = {
  id: string;
  title: string;
  priceLabel: string;
  sold: number;
  total: number;
  status: "Aberta";
  coverUrl?: string;
};

type GameSearchResult = {
  id: number;
  name: string;
  background_image: string | null;
};

/** Fallback quando não há NEXT_PUBLIC_RAWG_API_KEY (interface + testes) */
const MOCK_GAMES: GameSearchResult[] = [
  {
    id: 101,
    name: "Elden Ring",
    background_image:
      "https://media.rawg.io/media/games/5c0/5c0ddfc02ee5f3d621a5b37b293fdb9f.jpg",
  },
  {
    id: 102,
    name: "Dead Space (2023)",
    background_image:
      "https://media.rawg.io/media/games/d58/d588947d428c20a53d210b82c51d257d.jpg",
  },
  {
    id: 103,
    name: "Counter-Strike 2",
    background_image:
      "https://media.rawg.io/media/games/736/73619bd336c2d05d4d929d60a1777c60.jpg",
  },
];

const INITIAL_RAFFLES: MockRaffle[] = [
  {
    id: "1",
    title: "Dead Space Remake - Steam Key",
    priceLabel: "R$ 3,00",
    sold: 75,
    total: 100,
    status: "Aberta",
  },
  {
    id: "2",
    title: "Elden Ring",
    priceLabel: "R$ 2,00",
    sold: 42,
    total: 100,
    status: "Aberta",
  },
  {
    id: "3",
    title: "CS2 Prime + AWP Skin",
    priceLabel: "R$ 1,50",
    sold: 12,
    total: 50,
    status: "Aberta",
  },
];

async function fetchRawgGames(query: string): Promise<GameSearchResult[]> {
  const key = process.env.NEXT_PUBLIC_RAWG_API_KEY;
  const useMock =
    !key ||
    key === "SUA_CHAVE_AQUI" ||
    key.trim() === "";

  if (useMock) {
    await new Promise((r) => setTimeout(r, 450));
    const q = query.toLowerCase();
    if (!q) return [];
    return MOCK_GAMES.filter((g) => g.name.toLowerCase().includes(q));
  }

  const url = new URL("https://api.rawg.io/api/games");
  url.searchParams.set("key", key);
  url.searchParams.set("search", query);
  url.searchParams.set("page_size", "8");

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = (await res.json()) as {
    results?: GameSearchResult[];
  };
  return data.results ?? [];
}

export default function AdminPage() {
  const [raffles, setRaffles] = useState<MockRaffle[]>(INITIAL_RAFFLES);
  const [title, setTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [totalNumbers, setTotalNumbers] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const blurCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(title.trim()), 500);
    return () => clearTimeout(id);
  }, [title]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);

    (async () => {
      try {
        const results = await fetchRawgGames(searchQuery);
        if (!cancelled) {
          setSearchResults(results);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const openSuggestions = useCallback(() => {
    if (blurCloseRef.current) clearTimeout(blurCloseRef.current);
    setSuggestionsOpen(true);
  }, []);

  const scheduleCloseSuggestions = useCallback(() => {
    blurCloseRef.current = setTimeout(() => setSuggestionsOpen(false), 180);
  }, []);

  const selectGame = useCallback((game: GameSearchResult) => {
    if (blurCloseRef.current) clearTimeout(blurCloseRef.current);
    setTitle(game.name);
    setCoverUrl(game.background_image ?? "");
    setSearchResults([]);
    setSuggestionsOpen(false);
  }, []);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Math.max(1, parseInt(totalNumbers, 10) || 100);
    const newRaffle: MockRaffle = {
      id: crypto.randomUUID(),
      title: title.trim() || "Sem título",
      priceLabel: price.trim().startsWith("R$")
        ? price.trim()
        : `R$ ${price.trim() || "0,00"}`,
      sold: 0,
      total,
      status: "Aberta",
      coverUrl: coverUrl.trim() || undefined,
    };
    setRaffles((prev) => [newRaffle, ...prev]);
    setTitle("");
    setSearchQuery("");
    setSearchResults([]);
    setPrice("");
    setTotalNumbers("");
    setCoverUrl("");
    setSuggestionsOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="flex flex-col gap-4 border-b border-apex-surface pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg border border-apex-primary/30 bg-apex-surface text-apex-accent">
            <ShieldAlert className="size-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-apex-text sm:text-2xl">
              Comando Central - Apex Keys
            </h1>
            <p className="text-sm text-apex-text/50">
              Gestão de sorteios e operações
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-apex-text/50 transition-colors hover:text-apex-accent"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Voltar ao Site
        </Link>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_2fr]">
        <section className="rounded-xl border border-apex-primary/20 bg-apex-surface p-6">
          <h2 className="text-lg font-bold text-apex-text">
            Iniciar Novo Sorteio
          </h2>
          <p className="mt-1 text-sm text-apex-text/50">
            Nova operação na vitrine
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleLaunch}>
            <div className="relative">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                  Buscar jogo (RAWG)
                </span>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-apex-accent/70"
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      openSuggestions();
                    }}
                    onFocus={openSuggestions}
                    onBlur={scheduleCloseSuggestions}
                    className={`${inputClass} pl-10`}
                    placeholder="Digite para buscar (ex: Elden)…"
                    autoComplete="off"
                  />
                </div>
              </label>

              {suggestionsOpen &&
                (searchLoading || searchResults.length > 0) &&
                title.trim().length >= 2 && (
                  <ul
                    className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-apex-primary/20 bg-apex-surface shadow-2xl"
                    role="listbox"
                  >
                    {searchLoading ? (
                      <li className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-apex-text/60">
                        <Loader2
                          className="size-4 shrink-0 animate-spin text-apex-accent"
                          aria-hidden
                        />
                        Buscando jogos…
                      </li>
                    ) : searchResults.length === 0 ? (
                      <li className="px-3 py-4 text-center text-sm text-apex-text/50">
                        Nenhum jogo encontrado.
                      </li>
                    ) : (
                      searchResults.map((game) => (
                        <li key={game.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-apex-bg"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectGame(game)}
                          >
                            <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-apex-bg">
                              {game.background_image ? (
                                <Image
                                  src={game.background_image}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              ) : null}
                            </div>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-apex-text">
                              {game.name}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
            </div>

            <div className="rounded-xl border border-apex-accent/10 bg-apex-bg/50 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
              <p className="text-xs font-medium uppercase tracking-wide text-apex-text/45">
                Preview da capa
              </p>
              <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-lg border border-apex-primary/15 bg-apex-bg">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL editável (qualquer host)
                  <img
                    src={coverUrl}
                    alt={title || "Capa do jogo"}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-apex-text/40">
                    Selecione um jogo na busca
                  </div>
                )}
              </div>
              {title ? (
                <p className="mt-2 truncate text-sm font-semibold text-apex-text/90">
                  {title}
                </p>
              ) : null}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                Preço da Cota (R$)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
                placeholder="9,90"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                Total de Números
              </span>
              <input
                type="number"
                min={1}
                value={totalNumbers}
                onChange={(e) => setTotalNumbers(e.target.value)}
                className={inputClass}
                placeholder="100"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                URL da Imagem de Capa
              </span>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className={inputClass}
                placeholder="Preenchido ao escolher o jogo — editável"
              />
            </label>
            <button
              type="submit"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-apex-accent py-3 font-bold text-apex-bg transition-opacity hover:opacity-90"
            >
              <Plus className="size-5 shrink-0" aria-hidden />
              Lançar Operação
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-apex-primary/20 bg-apex-surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-apex-text">
            <Play
              className="size-5 shrink-0 text-apex-accent"
              aria-hidden
            />
            Rifas em Andamento
          </h2>
          <p className="mt-1 text-sm text-apex-text/50">
            {raffles.length} operação(ões) listada(s)
          </p>

          <div className="mt-6 space-y-4">
            {raffles.map((raffle) => {
              const pct = Math.round((raffle.sold / raffle.total) * 100);
              return (
                <article
                  key={raffle.id}
                  className="rounded-lg border border-apex-accent/10 bg-apex-bg/40 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {raffle.coverUrl ? (
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-apex-primary/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={raffle.coverUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-apex-text">
                          {raffle.title}
                        </h3>
                        <p className="mt-1 text-sm text-apex-accent/90">
                          {raffle.priceLabel} / cota
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md border border-apex-primary/25 bg-apex-surface px-2.5 py-1 text-xs font-medium text-apex-text/80">
                      {raffle.status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-apex-text/55">
                      <span>
                        {raffle.sold}/{raffle.total} vendidos
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-white/[0.06] bg-apex-bg shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
                      <div
                        className="h-full rounded-full bg-apex-accent/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-apex-primary px-3 py-2 text-xs font-semibold text-apex-primary transition-colors hover:bg-apex-primary hover:text-white"
                    >
                      <Target className="size-3.5 shrink-0" aria-hidden />
                      Sortear Vencedor
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/50 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5 shrink-0" aria-hidden />
                      Cancelar &amp; Estornar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
