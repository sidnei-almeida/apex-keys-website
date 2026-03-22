"use client";

import {
  ArrowLeft,
  Check,
  Edit,
  Link as LinkIcon,
  Loader2,
  Play,
  Plus,
  Search,
  ShieldAlert,
  Target,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { getApiBaseUrl } from "@/lib/api/config";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { RafflePublic } from "@/types/api";
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
  status: string;
  coverUrl?: string;
  /** Valores da API / formulário para modo edição */
  imageUrlRaw?: string | null;
  videoId?: string | null;
  totalPriceNum?: number;
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
    imageUrlRaw:
      "https://media.rawg.io/media/games/d58/d588947d428c20a53d210b82c51d257d.jpg",
    videoId: null,
    totalPriceNum: 300,
  },
  {
    id: "2",
    title: "Elden Ring",
    priceLabel: "R$ 2,00",
    sold: 42,
    total: 100,
    status: "Aberta",
    imageUrlRaw:
      "https://media.rawg.io/media/games/5c0/5c0ddfc02ee5f3d621a5b37b293fdb9f.jpg",
    videoId: null,
    totalPriceNum: 200,
  },
  {
    id: "3",
    title: "CS2 Prime + AWP Skin",
    priceLabel: "R$ 1,50",
    sold: 12,
    total: 50,
    status: "Aberta",
    imageUrlRaw: null,
    videoId: null,
    totalPriceNum: 75,
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

function mapRafflePublicToRow(r: RafflePublic): MockRaffle {
  const ticket = parseFloat(r.ticket_price);
  const priceLabel = Number.isFinite(ticket)
    ? `R$ ${ticket.toFixed(2).replace(".", ",")}`
    : `R$ ${r.ticket_price}`;
  const totalPriceNum = parseFloat(r.total_price);
  return {
    id: r.id,
    title: r.title,
    priceLabel,
    sold: 0,
    total: r.total_tickets,
    status: r.status,
    coverUrl: r.image_url ?? undefined,
    imageUrlRaw: r.image_url,
    videoId: r.video_id,
    totalPriceNum: Number.isFinite(totalPriceNum) ? totalPriceNum : undefined,
  };
}

export default function AdminPage() {
  const [raffles, setRaffles] = useState<MockRaffle[]>(INITIAL_RAFFLES);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRaffleId, setEditingRaffleId] = useState<string | null>(null);
  const [copiedRaffleId, setCopiedRaffleId] = useState<string | null>(null);
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isEditing = editingRaffleId !== null;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
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

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current) {
        clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

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
    setImageUrl(game.background_image ?? "");
    setSearchResults([]);
    setSuggestionsOpen(false);
  }, []);

  const resetCreateForm = useCallback(() => {
    setTitle("");
    setSearchQuery("");
    setSearchResults([]);
    setImageUrl("");
    setVideoId("");
    setTotalPrice(0);
    setTotalTickets(0);
    setSuggestionsOpen(false);
    setEditingRaffleId(null);
  }, []);

  const copyRafflePublicLink = useCallback((raffleId: string) => {
    if (copyFeedbackTimerRef.current) {
      clearTimeout(copyFeedbackTimerRef.current);
    }
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/raffle/${raffleId}`
        : `/raffle/${raffleId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedRaffleId(raffleId);
      copyFeedbackTimerRef.current = setTimeout(() => {
        setCopiedRaffleId(null);
        copyFeedbackTimerRef.current = null;
      }, 2000);
    });
  }, []);

  const loadRaffleIntoForm = useCallback((raffle: MockRaffle) => {
    setEditingRaffleId(raffle.id);
    setTitle(raffle.title);
    setImageUrl(
      (raffle.imageUrlRaw?.trim() || raffle.coverUrl || "").trim(),
    );
    setVideoId((raffle.videoId ?? "").trim());
    setTotalPrice(raffle.totalPriceNum ?? 0);
    setTotalTickets(raffle.total);
    setMessage(null);
    setSuggestionsOpen(false);
    setSearchResults([]);
  }, []);

  const handleCancelEdit = useCallback(() => {
    resetCreateForm();
    setMessage(null);
  }, [resetCreateForm]);

  const handleCreateOrUpdateRaffle = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage({ type: "error", text: "Informe o título do sorteio." });
      return;
    }
    if (totalPrice <= 0) {
      setMessage({
        type: "error",
        text: "O preço total da rifa deve ser maior que zero.",
      });
      return;
    }
    if (!Number.isInteger(totalTickets) || totalTickets < 1) {
      setMessage({
        type: "error",
        text: "O total de bilhetes deve ser um inteiro ≥ 1.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = getAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const body = JSON.stringify({
        title: trimmedTitle,
        image_url: imageUrl.trim() || null,
        video_id: videoId.trim() || null,
        total_price: totalPrice,
        total_tickets: totalTickets,
      });

      const url = editingRaffleId
        ? `${getApiBaseUrl()}/admin/raffles/${editingRaffleId}`
        : `${getApiBaseUrl()}/admin/raffles`;

      const res = await fetch(url, {
        method: editingRaffleId ? "PATCH" : "POST",
        headers,
        body,
      });

      const text = await res.text();
      let data: unknown = null;
      if (text) {
        try {
          data = JSON.parse(text) as unknown;
        } catch {
          data = text;
        }
      }

      if (!res.ok) {
        const detail =
          data &&
          typeof data === "object" &&
          data !== null &&
          "detail" in data &&
          typeof (data as { detail: unknown }).detail === "string"
            ? (data as { detail: string }).detail
            : `Erro ${res.status}`;
        setMessage({ type: "error", text: detail });
        return;
      }

      const saved = data as RafflePublic;
      if (editingRaffleId) {
        setRaffles((prev) =>
          prev.map((row) =>
            row.id === editingRaffleId ? mapRafflePublicToRow(saved) : row,
          ),
        );
        resetCreateForm();
        setMessage({
          type: "success",
          text: "Alterações guardadas com sucesso.",
        });
      } else {
        setRaffles((prev) => [mapRafflePublicToRow(saved), ...prev]);
        resetCreateForm();
        setMessage({
          type: "success",
          text: "Sorteio criado com sucesso.",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Falha de rede ao contactar a API.",
      });
    } finally {
      setIsLoading(false);
    }
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
            {isEditing ? "Editar Sorteio" : "Iniciar Novo Sorteio"}
          </h2>
          <p className="mt-1 text-sm text-apex-text/50">
            {isEditing
              ? "Atualize os dados da operação selecionada"
              : "Nova operação na vitrine"}
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleCreateOrUpdateRaffle}>
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
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL editável (qualquer host)
                  <img
                    src={imageUrl}
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
                URL da Imagem de Capa
              </span>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputClass}
                placeholder="Preenchido ao escolher o jogo — editável"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                ID do vídeo YouTube (opcional)
              </span>
              <input
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                className={inputClass}
                placeholder="ex.: dQw4w9WgXcQ"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                Preço total da rifa
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={totalPrice > 0 ? totalPrice : ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setTotalPrice(Number.isFinite(v) ? v : 0);
                }}
                className={inputClass}
                placeholder="Ex.: 300 (valor total a arrecadar)"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                Total de bilhetes
              </span>
              <input
                type="number"
                min={1}
                step={1}
                value={totalTickets > 0 ? totalTickets : ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setTotalTickets(Number.isFinite(v) ? v : 0);
                }}
                className={inputClass}
                placeholder="100"
              />
            </label>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <button
                type="submit"
                disabled={isLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-apex-accent py-3 font-bold text-apex-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEditing ? (
                  <Check className="size-5 shrink-0" aria-hidden />
                ) : (
                  <Plus className="size-5 shrink-0" aria-hidden />
                )}
                {isLoading
                  ? "Processando…"
                  : isEditing
                    ? "Salvar Alterações"
                    : "Lançar Operação"}
              </button>
              {isEditing ? (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleCancelEdit}
                  className="shrink-0 rounded-xl border border-apex-text/20 bg-transparent px-5 py-3 text-sm font-medium text-apex-text/55 transition-colors hover:border-apex-text/35 hover:bg-apex-bg/50 hover:text-apex-text/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
            {message ? (
              <p
                role="status"
                className={
                  message.type === "success"
                    ? "mt-3 text-center text-sm text-apex-success"
                    : "mt-3 text-center text-sm text-red-400"
                }
              >
                {message.text}
              </p>
            ) : null}
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
                    <div className="relative flex shrink-0 items-center gap-1">
                      <span className="rounded-md border border-apex-primary/25 bg-apex-surface px-2.5 py-1 text-xs font-medium text-apex-text/80">
                        {raffle.status}
                      </span>
                      <div className="relative flex items-center">
                        <button
                          type="button"
                          onClick={() => copyRafflePublicLink(raffle.id)}
                          className="rounded-md p-1 text-apex-text/50 transition-colors hover:text-apex-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-apex-accent/35"
                          aria-label="Copiar link público da rifa"
                        >
                          <LinkIcon className="size-3.5" aria-hidden />
                        </button>
                        {copiedRaffleId === raffle.id ? (
                          <span
                            role="status"
                            className="pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded border border-apex-accent/25 bg-apex-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-apex-accent shadow-lg"
                          >
                            Copiado
                          </span>
                        ) : null}
                      </div>
                    </div>
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
                      onClick={() => loadRaffleIntoForm(raffle)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-apex-accent px-3 py-2 text-xs font-semibold text-apex-accent transition-colors hover:bg-apex-accent/10"
                    >
                      <Edit className="size-3.5 shrink-0" aria-hidden />
                      Editar Dados
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
