"use client";

import {
  ArrowLeft,
  Check,
  CirclePause,
  Edit,
  Link as LinkIcon,
  Loader2,
  Plus,
  ReceiptText,
  Rocket,
  Search,
  ShieldAlert,
  TableProperties,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { getApiBaseUrl } from "@/lib/api/config";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { RafflePublic } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-apex-surface bg-apex-bg px-3 py-2.5 text-apex-text placeholder:text-gray-500 focus:border-apex-accent focus:outline-none";

const thClass =
  "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-apex-text/60";
const tdClass = "px-3 py-3 align-middle text-sm text-apex-text/90";
const rowClass =
  "border-t border-white/[0.06] transition-colors hover:bg-white/5";

/** Extrai o ID de vídeo (11 caracteres) de URLs YouTube comuns. */
const YOUTUBE_VIDEO_ID_RE =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

function extractYoutubeVideoId(input: string): string | null {
  const m = input.trim().match(YOUTUBE_VIDEO_ID_RE);
  return m?.[1] ?? null;
}

const YOUTUBE_STANDALONE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

/** Valor a enviar em `video_id`: só ID de 11 caracteres ou null. */
function videoIdForApi(stored: string): string | null {
  const t = stored.trim();
  if (!t) return null;
  const fromUrl = extractYoutubeVideoId(t);
  if (fromUrl) return fromUrl;
  if (YOUTUBE_STANDALONE_ID_RE.test(t)) return t;
  return null;
}

type AdminTab = "launch" | "raffles" | "transactions";

type MockRaffle = {
  id: string;
  title: string;
  priceLabel: string;
  sold: number;
  total: number;
  status: string;
  coverUrl?: string;
  imageUrlRaw?: string | null;
  videoId?: string | null;
  totalPriceNum?: number;
  ticketPriceNum?: number;
  reservedPending: number;
  paused: boolean;
};

type PendingTxnRow = {
  id: string;
  clientName: string;
  clientEmail: string;
  raffleTitle: string;
  numbersLabel: string;
  amountLabel: string;
  status: "Aguardando Pagamento" | "Pago" | "Expirado/Caído";
};

type GameSearchResult = {
  id: number;
  name: string;
  background_image: string | null;
};

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
    status: "active",
    coverUrl:
      "https://media.rawg.io/media/games/d58/d588947d428c20a53d210b82c51d257d.jpg",
    imageUrlRaw:
      "https://media.rawg.io/media/games/d58/d588947d428c20a53d210b82c51d257d.jpg",
    videoId: null,
    totalPriceNum: 300,
    ticketPriceNum: 3,
    reservedPending: 4,
    paused: false,
  },
  {
    id: "2",
    title: "Elden Ring",
    priceLabel: "R$ 2,00",
    sold: 42,
    total: 100,
    status: "active",
    coverUrl:
      "https://media.rawg.io/media/games/5c0/5c0ddfc02ee5f3d621a5b37b293fdb9f.jpg",
    imageUrlRaw:
      "https://media.rawg.io/media/games/5c0/5c0ddfc02ee5f3d621a5b37b293fdb9f.jpg",
    videoId: null,
    totalPriceNum: 200,
    ticketPriceNum: 2,
    reservedPending: 2,
    paused: false,
  },
  {
    id: "3",
    title: "CS2 Prime + AWP Skin",
    priceLabel: "R$ 1,50",
    sold: 12,
    total: 50,
    status: "sold_out",
    coverUrl: undefined,
    imageUrlRaw: null,
    videoId: null,
    totalPriceNum: 75,
    ticketPriceNum: 1.5,
    reservedPending: 0,
    paused: false,
  },
];

const INITIAL_TXNS: PendingTxnRow[] = [
  {
    id: "t1",
    clientName: "João Silva",
    clientEmail: "joao@email.com",
    raffleTitle: "Elden Ring",
    numbersLabel: "#04, #12",
    amountLabel: "R$ 4,00",
    status: "Aguardando Pagamento",
  },
  {
    id: "t2",
    clientName: "Maria Costa",
    clientEmail: "maria.c@email.com",
    raffleTitle: "Dead Space Remake - Steam Key",
    numbersLabel: "#07",
    amountLabel: "R$ 3,00",
    status: "Aguardando Pagamento",
  },
  {
    id: "t3",
    clientName: "Pedro Alves",
    clientEmail: "pedro@email.com",
    raffleTitle: "CS2 Prime + AWP Skin",
    numbersLabel: "#21, #22",
    amountLabel: "R$ 3,00",
    status: "Expirado/Caído",
  },
];

function formatBrl(n: number): string {
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

function raffleDisplayStatus(r: MockRaffle): "Aberta" | "Encerrada" | "Pausada" {
  if (r.paused) return "Pausada";
  const s = r.status.toLowerCase();
  if (s === "active") return "Aberta";
  if (s === "canceled" || s === "cancelled") return "Encerrada";
  if (s === "sold_out" || s === "finished") return "Encerrada";
  if (s === "aberta") return "Aberta";
  return "Encerrada";
}

function statusBadgeClass(
  status: "Aberta" | "Encerrada" | "Pausada",
): string {
  if (status === "Aberta")
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400/95";
  if (status === "Pausada")
    return "border-amber-500/35 bg-amber-500/10 text-amber-400/95";
  return "border-apex-text/25 bg-apex-bg text-apex-text/70";
}

function txnStatusClass(
  s: PendingTxnRow["status"],
): string {
  if (s === "Pago") return "text-emerald-400/95";
  if (s === "Aguardando Pagamento") return "text-amber-400/95";
  return "text-red-400/90";
}

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
    ticketPriceNum: Number.isFinite(ticket) ? ticket : undefined,
    reservedPending: 0,
    paused: false,
  };
}

const TAB_DEF: {
  id: AdminTab;
  label: string;
  icon: typeof Rocket;
}[] = [
  { id: "launch", label: "Lançar Operação", icon: Rocket },
  { id: "raffles", label: "Gestão de Rifas", icon: TableProperties },
  { id: "transactions", label: "Transações & Controle", icon: ReceiptText },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("launch");
  const [raffles, setRaffles] = useState<MockRaffle[]>(INITIAL_RAFFLES);
  const [txns, setTxns] = useState<PendingTxnRow[]>(INITIAL_TXNS);

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
    setActiveTab("launch");
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

  const toggleRafflePause = useCallback((id: string) => {
    setRaffles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, paused: !r.paused } : r)),
    );
  }, []);

  const handleCancelEdit = useCallback(() => {
    resetCreateForm();
    setMessage(null);
  }, [resetCreateForm]);

  const approveTxn = useCallback((id: string) => {
    setTxns((prev) =>
      prev.map((t) =>
        t.id === id && t.status === "Aguardando Pagamento"
          ? { ...t, status: "Pago" as const }
          : t,
      ),
    );
  }, []);

  const cancelTxnRelease = useCallback((id: string) => {
    setTxns((prev) =>
      prev.map((t) =>
        t.id === id && t.status === "Aguardando Pagamento"
          ? { ...t, status: "Expirado/Caído" as const }
          : t,
      ),
    );
  }, []);

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
        video_id: videoIdForApi(videoId),
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
      const row = mapRafflePublicToRow(saved);
      if (editingRaffleId) {
        setRaffles((prev) =>
          prev.map((existing) => {
            if (existing.id !== editingRaffleId) return existing;
            return {
              ...row,
              sold: existing.sold,
              reservedPending: existing.reservedPending,
              paused: existing.paused,
            };
          }),
        );
        resetCreateForm();
        setMessage({
          type: "success",
          text: "Alterações guardadas com sucesso.",
        });
      } else {
        setRaffles((prev) => [row, ...prev]);
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

      <nav
        className="mt-8 flex flex-wrap gap-1 border-b border-apex-primary/15"
        aria-label="Secções do painel"
      >
        {TAB_DEF.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "border-apex-accent text-apex-accent"
                  : "border-transparent text-apex-text/50 hover:text-apex-text/80"
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6">
        {activeTab === "launch" ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
            <section className="rounded-xl border border-apex-primary/20 bg-apex-surface p-6">
              <h2 className="text-lg font-bold text-apex-text">
                {isEditing ? "Editar Sorteio" : "Iniciar Novo Sorteio"}
              </h2>
              <p className="mt-1 text-sm text-apex-text/50">
                {isEditing
                  ? "Atualize os dados da operação selecionada"
                  : "Nova operação na vitrine"}
              </p>
              <form
                className="mt-6 space-y-4"
                onSubmit={handleCreateOrUpdateRaffle}
              >
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
                    Link do vídeo no YouTube (opcional)
                  </span>
                  <input
                    type="text"
                    value={videoId}
                    onChange={(e) => {
                      const v = e.target.value;
                      const extracted = extractYoutubeVideoId(v);
                      setVideoId(extracted ?? v);
                    }}
                    onBlur={(e) => {
                      const v = e.target.value;
                      const extracted = extractYoutubeVideoId(v);
                      if (extracted) setVideoId(extracted);
                    }}
                    className={inputClass}
                    placeholder="Ex.: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
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

            <section className="rounded-xl border border-apex-accent/10 bg-apex-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-apex-text/45">
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
                  <div className="flex h-full min-h-[10rem] items-center justify-center text-sm text-apex-text/40">
                    Selecione um jogo na busca ou cole uma URL
                  </div>
                )}
              </div>
              {title ? (
                <p className="mt-3 truncate text-sm font-semibold text-apex-text/90">
                  {title}
                </p>
              ) : null}
            </section>
          </div>
        ) : null}

        {activeTab === "raffles" ? (
          <section className="rounded-xl border border-apex-primary/20 bg-apex-surface p-4 sm:p-6">
            <h2 className="text-lg font-bold text-apex-text">
              Gestão de Rifas
            </h2>
            <p className="mt-1 text-sm text-apex-text/50">
              {raffles.length} operação(ões) — visão em tabela
            </p>

            <div className="mt-6 overflow-x-auto rounded-lg border border-apex-primary/15">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead>
                  <tr className="bg-apex-bg/60">
                    <th className={thClass}>Jogo / Título</th>
                    <th className={`${thClass} min-w-[140px]`}>Progresso</th>
                    <th className={thClass}>Reservados</th>
                    <th className={thClass}>Cota / Total</th>
                    <th className={thClass}>Arrecadado</th>
                    <th className={thClass}>Status</th>
                    <th className={`${thClass} text-right`}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {raffles.map((raffle) => {
                    const pct = Math.round(
                      (raffle.sold / Math.max(raffle.total, 1)) * 100,
                    );
                    const ticket =
                      raffle.ticketPriceNum ??
                      (raffle.total > 0 && raffle.totalPriceNum
                        ? raffle.totalPriceNum / raffle.total
                        : 0);
                    const collected = ticket * raffle.sold;
                    const disp = raffleDisplayStatus(raffle);
                    return (
                      <tr key={raffle.id} className={rowClass}>
                        <td className={tdClass}>
                          <div className="flex min-w-0 items-center gap-3">
                            {raffle.coverUrl ? (
                              <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-apex-primary/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={raffle.coverUrl}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="size-10 shrink-0 rounded-md border border-dashed border-apex-text/20 bg-apex-bg" />
                            )}
                            <span className="min-w-0 font-medium text-apex-text">
                              {raffle.title}
                            </span>
                          </div>
                        </td>
                        <td className={tdClass}>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-apex-text/55">
                              {raffle.sold}/{raffle.total}
                            </span>
                            <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full border border-white/[0.06] bg-apex-bg">
                              <div
                                className="h-full rounded-full bg-apex-accent/85"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className={`${tdClass} text-apex-text/75`}>
                          {raffle.reservedPending} aguard. Pix
                        </td>
                        <td className={`${tdClass} text-apex-text/80`}>
                          <span className="text-apex-accent/90">
                            {raffle.priceLabel}
                          </span>
                          <span className="text-apex-text/45"> · </span>
                          <span>
                            {raffle.totalPriceNum != null
                              ? formatBrl(raffle.totalPriceNum)
                              : "—"}
                          </span>
                        </td>
                        <td className={`${tdClass} font-medium tabular-nums text-apex-text`}>
                          {formatBrl(collected)}
                        </td>
                        <td className={tdClass}>
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(disp)}`}
                          >
                            {disp}
                          </span>
                        </td>
                        <td className={`${tdClass} text-right`}>
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              onClick={() => loadRaffleIntoForm(raffle)}
                              className="rounded-md p-2 text-apex-text/50 transition-colors hover:bg-white/5 hover:text-apex-accent"
                              aria-label="Editar dados da rifa"
                            >
                              <Edit className="size-4" aria-hidden />
                            </button>
                            <div className="relative inline-flex">
                              <button
                                type="button"
                                onClick={() => copyRafflePublicLink(raffle.id)}
                                className="rounded-md p-2 text-apex-text/50 transition-colors hover:bg-white/5 hover:text-apex-accent"
                                aria-label="Copiar link público"
                              >
                                <LinkIcon className="size-4" aria-hidden />
                              </button>
                              {copiedRaffleId === raffle.id ? (
                                <span className="pointer-events-none absolute right-0 top-full z-10 mt-0.5 whitespace-nowrap rounded border border-apex-accent/25 bg-apex-bg px-1.5 py-0.5 text-[10px] font-semibold text-apex-accent">
                                  Copiado
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleRafflePause(raffle.id)}
                              className="rounded-md p-2 text-apex-text/50 transition-colors hover:bg-white/5 hover:text-amber-400/90"
                              aria-label={
                                raffle.paused
                                  ? "Retomar rifa"
                                  : "Pausar rifa"
                              }
                            >
                              <CirclePause className="size-4" aria-hidden />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === "transactions" ? (
          <section className="rounded-xl border border-apex-primary/20 bg-apex-surface p-4 sm:p-6">
            <h2 className="text-lg font-bold text-apex-text">
              Transações &amp; Controle
            </h2>
            <p className="mt-1 text-sm text-apex-text/50">
              Aprovação manual e libertação de números (dados de demonstração —
              integrar com API quando disponível)
            </p>

            <div className="mt-6 overflow-x-auto rounded-lg border border-apex-primary/15">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="bg-apex-bg/60">
                    <th className={thClass}>Cliente</th>
                    <th className={thClass}>Rifa</th>
                    <th className={thClass}>Números</th>
                    <th className={thClass}>Valor</th>
                    <th className={thClass}>Status</th>
                    <th className={`${thClass} text-right`}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id} className={rowClass}>
                      <td className={tdClass}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-apex-text">
                            {t.clientName}
                          </span>
                          <span className="text-xs text-apex-text/50">
                            {t.clientEmail}
                          </span>
                        </div>
                      </td>
                      <td className={`${tdClass} max-w-[200px]`}>
                        <span className="line-clamp-2">{t.raffleTitle}</span>
                      </td>
                      <td className={`${tdClass} font-mono text-xs text-apex-accent/90`}>
                        {t.numbersLabel}
                      </td>
                      <td className={`${tdClass} font-medium tabular-nums`}>
                        {t.amountLabel}
                      </td>
                      <td className={tdClass}>
                        <span className={`text-sm font-medium ${txnStatusClass(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={t.status !== "Aguardando Pagamento"}
                            onClick={() => approveTxn(t.id)}
                            className="rounded-lg border border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-400/95 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            Aprovar Manualmente
                          </button>
                          <button
                            type="button"
                            disabled={t.status !== "Aguardando Pagamento"}
                            onClick={() => cancelTxnRelease(t.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/45 px-2.5 py-1.5 text-xs font-semibold text-red-400/95 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            <XCircle className="size-3.5 shrink-0" aria-hidden />
                            Cancelar / Libertar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
