"use client";

import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Check,
  CirclePause,
  Clock,
  Edit,
  ExternalLink,
  Hash,
  Link as LinkIcon,
  Loader2,
  Plus,
  ReceiptText,
  Rocket,
  ShieldAlert,
  TableProperties,
  Trash2,
  TrendingUp,
  Wand2,
  XCircle,
} from "lucide-react";
import type React from "react";
import { ApiError } from "@/lib/api/http";
import { adminDeleteRaffle } from "@/lib/api/services";
import { getApiBaseUrl } from "@/lib/api/config";
import { translateLabelList, translateToPtBr } from "@/lib/translate/client";
import { getAccessToken } from "@/lib/auth/token-storage";
import { fetchIgdbGame } from "@/services/api";
import type { IgdbGameInfoResponse, RafflePublic } from "@/types/api";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-apex-surface bg-apex-bg px-3 py-2.5 text-apex-text placeholder:text-gray-500 focus:border-apex-accent focus:outline-none";

const IGDB_LOADING_STEPS = [
  "Conectando ao IGDB…",
  "Scraper iniciado — aguardando servidor…",
  "Coletando metadados do jogo…",
  "Processando informações…",
  "Quase lá, finalizando…",
] as const;

const thClass =
  "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-apex-text-muted";
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
  summaryPt?: string | null;
  genresPt?: string[];
  seriesPt?: string[];
  gameModesPt?: string[];
  perspectivesPt?: string[];
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

function IgdbChipRow({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <div className="mt-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-apex-text/45">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((x, i) => (
          <span
            key={`${label}-${i}-${x}`}
            className="rounded-md border border-apex-accent/20 bg-apex-accent/5 px-2 py-0.5 text-xs text-apex-text/85"
          >
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accentClass = "text-apex-accent",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  accentClass?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-apex-surface p-5 shadow-[0_4px_20px_rgb(0,0,0,0.25)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-apex-text-muted">
          {title}
        </p>
        <div className="shrink-0 rounded-md bg-white/[0.04] p-1.5">
          <Icon className={`size-4 ${accentClass}`} aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-apex-text">
        {value}
      </p>
    </div>
  );
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
    summaryPt: r.summary ?? undefined,
    genresPt: r.genres,
    seriesPt: r.series,
    gameModesPt: r.game_modes,
    perspectivesPt: r.player_perspectives,
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

  const [igdbInputUrl, setIgdbInputUrl] = useState("");
  const [isFetchingIgdb, setIsFetchingIgdb] = useState(false);
  const [igdbStep, setIgdbStep] = useState(0);
  const [igdbError, setIgdbError] = useState<string | null>(null);
  const [igdbMeta, setIgdbMeta] = useState<IgdbGameInfoResponse | null>(null);
  const [isTranslatingMeta, setIsTranslatingMeta] = useState(false);
  const [summaryPt, setSummaryPt] = useState("");
  const [genresPt, setGenresPt] = useState<string[]>([]);
  const [seriesPt, setSeriesPt] = useState<string[]>([]);
  const [gameModesPt, setGameModesPt] = useState<string[]>([]);
  const [perspectivesPt, setPerspectivesPt] = useState<string[]>([]);

  const [deletingRaffleId, setDeletingRaffleId] = useState<string | null>(
    null,
  );
  const [rafflesDeleteError, setRafflesDeleteError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current) {
        clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const resetCreateForm = useCallback(() => {
    setTitle("");
    setIgdbInputUrl("");
    setIgdbError(null);
    setIgdbMeta(null);
    setIsTranslatingMeta(false);
    setSummaryPt("");
    setGenresPt([]);
    setSeriesPt([]);
    setGameModesPt([]);
    setPerspectivesPt([]);
    setImageUrl("");
    setVideoId("");
    setTotalPrice(0);
    setTotalTickets(0);
    setEditingRaffleId(null);
  }, []);

  useEffect(() => {
    if (!isFetchingIgdb) {
      setIgdbStep(0);
      return;
    }
    setIgdbStep(0);
    const id = setInterval(() => {
      setIgdbStep((s) =>
        s < IGDB_LOADING_STEPS.length - 1 ? s + 1 : s,
      );
    }, 2200);
    return () => clearInterval(id);
  }, [isFetchingIgdb]);

  const handleFetchIgdb = useCallback(async () => {
    const url = igdbInputUrl.trim();
    if (!url) {
      setIgdbError("Cole a URL da ficha do jogo no IGDB.");
      return;
    }
    setIgdbError(null);
    setIsFetchingIgdb(true);
    const debugIgdb =
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_DEBUG_IGDB === "1";
    if (debugIgdb) {
      console.log(
        "[Apex IGDB][admin]",
        JSON.stringify({
          phase: "handleFetchIgdb:start",
          igdbPageUrlPreview: url.slice(0, 100),
        }),
      );
    }
    try {
      const data = await fetchIgdbGame(url);
      setIgdbMeta(data);
      const nextTitle =
        (data.title?.trim() || data.name?.trim() || "").trim();
      if (nextTitle) setTitle(nextTitle);

      setSummaryPt("");
      setGenresPt([]);
      setSeriesPt([]);
      setGameModesPt([]);
      setPerspectivesPt([]);
      setIsTranslatingMeta(true);
      try {
        if (data.summary?.trim()) {
          const { translated } = await translateToPtBr(data.summary.trim());
          setSummaryPt(translated);
        }
        setGenresPt(await translateLabelList(data.genres ?? []));
        setSeriesPt(await translateLabelList(data.series ?? []));
        setGameModesPt(await translateLabelList(data.game_modes ?? []));
        setPerspectivesPt(
          await translateLabelList(data.player_perspectives ?? []),
        );
      } catch {
        if (data.summary?.trim()) setSummaryPt(data.summary.trim());
        setGenresPt([...(data.genres ?? [])]);
        setSeriesPt([...(data.series ?? [])]);
        setGameModesPt([...(data.game_modes ?? [])]);
        setPerspectivesPt([...(data.player_perspectives ?? [])]);
      } finally {
        setIsTranslatingMeta(false);
      }

      if (debugIgdb) {
        console.log(
          "[Apex IGDB][admin]",
          JSON.stringify({
            phase: "handleFetchIgdb:success",
            titleSet: Boolean(nextTitle),
            genres: data.genres?.length ?? 0,
          }),
        );
      }
    } catch (err) {
      if (debugIgdb) {
        console.warn(
          "[Apex IGDB][admin]",
          JSON.stringify({
            phase: "handleFetchIgdb:error",
            name: err instanceof Error ? err.name : typeof err,
            message: err instanceof Error ? err.message : String(err),
          }),
        );
      }
      setIgdbError(
        err instanceof Error ? err.message : "Falha ao buscar dados no IGDB.",
      );
    } finally {
      setIsFetchingIgdb(false);
    }
  }, [igdbInputUrl]);

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
    setIgdbInputUrl("");
    setIgdbError(null);
    setIgdbMeta(null);
    setSummaryPt(raffle.summaryPt ?? "");
    setGenresPt(raffle.genresPt ?? []);
    setSeriesPt(raffle.seriesPt ?? []);
    setGameModesPt(raffle.gameModesPt ?? []);
    setPerspectivesPt(raffle.perspectivesPt ?? []);
  }, []);

  const toggleRafflePause = useCallback((id: string) => {
    setRaffles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, paused: !r.paused } : r)),
    );
  }, []);

  const handleDeleteRaffle = useCallback(
    async (raffleId: string) => {
      setRafflesDeleteError(null);
      setDeletingRaffleId(raffleId);
      try {
        const token = getAccessToken();
        await adminDeleteRaffle(token ?? "", raffleId);
        setRaffles((prev) => prev.filter((r) => r.id !== raffleId));
        if (editingRaffleId === raffleId) {
          resetCreateForm();
          setMessage(null);
        }
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? (err.detail ?? err.message)
            : err instanceof Error
              ? err.message
              : "Não foi possível apagar a rifa.";
        setRafflesDeleteError(msg);
      } finally {
        setDeletingRaffleId(null);
      }
    },
    [editingRaffleId, resetCreateForm],
  );

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

      const bodyPayload: Record<string, unknown> = {
        title: trimmedTitle,
        image_url: imageUrl.trim() || null,
        video_id: videoIdForApi(videoId),
        total_price: totalPrice,
        total_tickets: totalTickets,
      };
      const s = summaryPt.trim();
      if (s) bodyPayload.summary = s;
      if (genresPt.length) bodyPayload.genres = genresPt;
      if (seriesPt.length) bodyPayload.series = seriesPt;
      if (gameModesPt.length) bodyPayload.game_modes = gameModesPt;
      if (perspectivesPt.length)
        bodyPayload.player_perspectives = perspectivesPt;
      const body = JSON.stringify(bodyPayload);

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
              summaryPt: row.summaryPt ?? existing.summaryPt,
              genresPt:
                row.genresPt && row.genresPt.length > 0
                  ? row.genresPt
                  : existing.genresPt,
              seriesPt:
                row.seriesPt && row.seriesPt.length > 0
                  ? row.seriesPt
                  : existing.seriesPt,
              gameModesPt:
                row.gameModesPt && row.gameModesPt.length > 0
                  ? row.gameModesPt
                  : existing.gameModesPt,
              perspectivesPt:
                row.perspectivesPt && row.perspectivesPt.length > 0
                  ? row.perspectivesPt
                  : existing.perspectivesPt,
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

  // KPI derivations — raffles
  const activeRafflesCount = raffles.filter(
    (r) => raffleDisplayStatus(r) === "Aberta",
  ).length;
  const totalCollected = raffles.reduce((acc, r) => {
    const ticket =
      r.ticketPriceNum ??
      (r.total > 0 && r.totalPriceNum ? r.totalPriceNum / r.total : 0);
    return acc + ticket * r.sold;
  }, 0);
  const totalSoldTickets = raffles.reduce((acc, r) => acc + r.sold, 0);
  const totalPendingPix = raffles.reduce(
    (acc, r) => acc + r.reservedPending,
    0,
  );

  // KPI derivations — transactions
  const pendingTxnsCount = txns.filter(
    (t) => t.status === "Aguardando Pagamento",
  ).length;
  const paidTxnsCount = txns.filter((t) => t.status === "Pago").length;
  const expiredTxnsCount = txns.filter(
    (t) => t.status === "Expirado/Caído",
  ).length;

  const innerTitle =
    activeTab === "launch"
      ? isEditing
        ? "Editar Sorteio"
        : "Lançar Nova Operação"
      : activeTab === "raffles"
        ? "Gestão de Rifas"
        : "Transações & Controle";

  const innerSubtitle =
    activeTab === "launch"
      ? isEditing
        ? "Atualize os dados da operação selecionada"
        : "Cadastre um novo sorteio na vitrine pública"
      : activeTab === "raffles"
        ? `${raffles.length} operação(ões) registada(s)`
        : "Aprovação manual e controle de pagamentos";

  return (
    // Full-bleed: escapa o padding do <main> do layout
    <div className="-mx-4 -mb-8 -mt-6 flex min-h-[calc(100vh-4rem)] sm:-mx-6 lg:-mx-8">

      {/* ── SIDEBAR ────────────────────────────────────────────── */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-apex-surface lg:flex">
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-apex-accent/10 text-apex-accent">
            <ShieldAlert className="size-4" aria-hidden />
          </div>
          <span className="font-bold tracking-tight text-apex-text">
            Apex QG
          </span>
        </div>

        {/* Nav items */}
        <nav
          className="flex-1 space-y-0.5 px-3 py-4"
          aria-label="Secções do painel"
        >
          {TAB_DEF.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/[0.06] text-apex-accent"
                    : "text-apex-text-muted hover:bg-white/[0.04] hover:text-apex-text"
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-apex-accent"
                    aria-hidden
                  />
                )}
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-apex-text-muted transition-colors hover:text-apex-accent"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Voltar ao Site
          </Link>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Mobile tab bar (< lg) */}
        <nav
          className="flex flex-wrap gap-1 border-b border-apex-primary/15 px-4 py-2 lg:hidden"
          aria-label="Secções do painel"
        >
          {TAB_DEF.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "border-apex-accent text-apex-accent"
                    : "border-transparent text-apex-text-muted hover:text-apex-text"
                }`}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Inner header (desktop) */}
        <header className="sticky top-16 z-10 hidden items-center justify-between border-b border-white/[0.06] bg-apex-bg/95 px-6 py-4 backdrop-blur-sm lg:flex">
          <div>
            <h1 className="text-base font-bold text-apex-text lg:text-lg">
              {innerTitle}
            </h1>
            <p className="text-xs text-apex-text-muted">{innerSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "launch" && isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-sm text-apex-text-muted transition-colors hover:text-red-400"
              >
                Cancelar edição
              </button>
            )}
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-sm text-apex-text-muted transition-colors hover:text-apex-accent xl:flex"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              Voltar ao Site
            </Link>
          </div>
        </header>

        {/* ── CONTENT ──────────────────────────────────────────── */}
        <div className="flex-1 p-4 sm:p-6">

          {/* ── TAB: LANÇAR OPERAÇÃO ─────────────────────────── */}
          {activeTab === "launch" ? (
            <form
              onSubmit={handleCreateOrUpdateRaffle}
              className="grid gap-6 xl:grid-cols-[1fr_320px] xl:items-start"
            >
              {/* Left — metadata */}
              <div className="space-y-5 rounded-xl border border-apex-primary/20 bg-apex-surface p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] sm:p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* IGDB URL */}
                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                        URL da ficha do jogo no IGDB
                      </span>
                      <input
                        type="url"
                        value={igdbInputUrl}
                        onChange={(e) => {
                          setIgdbInputUrl(e.target.value);
                          setIgdbError(null);
                        }}
                        className={inputClass}
                        placeholder="https://www.igdb.com/games/…"
                        autoComplete="off"
                        disabled={isFetchingIgdb}
                      />
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleFetchIgdb()}
                        disabled={isFetchingIgdb}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-apex-accent/50 px-4 py-2 text-sm font-semibold text-apex-text-muted transition-colors hover:border-apex-accent hover:text-apex-accent disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {isFetchingIgdb ? (
                          <Loader2
                            className="size-4 shrink-0 animate-spin"
                            aria-hidden
                          />
                        ) : (
                          <Wand2 className="size-4 shrink-0" aria-hidden />
                        )}
                        {isFetchingIgdb ? "Buscando…" : "Buscar Dados"}
                      </button>
                    </div>

                    {isFetchingIgdb ? (
                      <div
                        role="status"
                        aria-live="polite"
                        className="mt-3 flex items-center gap-3 rounded-lg border border-apex-accent/20 bg-apex-bg/70 px-4 py-3 backdrop-blur-sm"
                      >
                        <div className="relative shrink-0">
                          <span className="absolute inset-0 animate-ping rounded-full bg-apex-accent/20" />
                          <Wand2
                            className="relative size-4 text-apex-accent/80"
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            key={igdbStep}
                            className="text-sm font-medium text-apex-accent/90"
                          >
                            {IGDB_LOADING_STEPS[igdbStep]}
                          </p>
                          <p className="mt-0.5 text-xs text-apex-text-muted">
                            O scraper pode levar até 10 s na primeira tentativa
                          </p>
                        </div>
                        <div className="ml-auto flex shrink-0 items-end gap-[3px] pb-[1px]">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="block w-[3px] animate-pulse rounded-full bg-apex-accent/50"
                              style={{
                                height: `${8 + i * 4}px`,
                                animationDelay: `${i * 200}ms`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {!isFetchingIgdb && igdbError ? (
                      <p
                        role="alert"
                        className="mt-2 text-sm text-red-400/90"
                      >
                        {igdbError}
                      </p>
                    ) : null}
                  </div>

                  {/* Título */}
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                      Título da rifa
                    </span>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputClass}
                      placeholder="Preenchido pela busca IGDB ou edite manualmente"
                      autoComplete="off"
                    />
                  </label>

                  {/* URL capa */}
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                      URL da Imagem de Capa
                    </span>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className={inputClass}
                      placeholder="Cole a URL da imagem de alta qualidade (ex: alphacoders.com)"
                    />
                    <p className="mt-1 text-[11px] text-apex-text/40">
                      Inserir manualmente — use imagens de alta qualidade do AlphaCoders ou similar.
                    </p>
                  </label>
                </div>

                {/* Traduzindo */}
                {isTranslatingMeta ? (
                  <p className="flex items-center gap-2 text-sm text-apex-accent/90">
                    <Loader2
                      className="size-4 shrink-0 animate-spin"
                      aria-hidden
                    />
                    A traduzir resumo e rótulos (EN → pt-BR)…
                  </p>
                ) : null}

                {/* Resumo */}
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                    Resumo (trecho IGDB)
                  </span>
                  <div
                    className={`${inputClass} min-h-[7rem] cursor-default bg-apex-bg/70 text-apex-text/90`}
                    aria-readonly
                  >
                    {isTranslatingMeta ? (
                      <p className="text-sm text-apex-text/40">…</p>
                    ) : summaryPt.trim() ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {summaryPt.trim()}
                      </p>
                    ) : (
                      <p className="text-sm text-apex-text/45">
                        Use «Buscar Dados» para carregar o resumo público da
                        ficha.
                      </p>
                    )}
                  </div>
                  {(() => {
                    const moreUrl = (
                      igdbMeta?.igdb_url?.trim() || igdbInputUrl.trim()
                    ).trim();
                    if (!moreUrl) return null;
                    return (
                      <a
                        href={moreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-apex-accent transition-colors hover:text-apex-accent/85"
                      >
                        Ver mais no IGDB
                        <ExternalLink
                          className="size-3.5 shrink-0 opacity-80"
                          aria-hidden
                        />
                      </a>
                    );
                  })()}
                </div>

                {/* Chips PT-BR */}
                <IgdbChipRow label="Géneros (PT-BR)" items={genresPt} />
                <IgdbChipRow label="Séries (PT-BR)" items={seriesPt} />
                <IgdbChipRow
                  label="Modos de jogo (PT-BR)"
                  items={gameModesPt}
                />
                <IgdbChipRow
                  label="Perspectiva (PT-BR)"
                  items={perspectivesPt}
                />

                {/* IGDB ref */}
                {igdbMeta ? (
                  <div className="rounded-lg border border-apex-primary/15 bg-apex-bg/45 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-apex-text-muted">
                      Referência IGDB
                    </p>
                    {(() => {
                      const igdbName = igdbMeta.name?.trim();
                      const igdbTitle = igdbMeta.title?.trim();
                      if (!igdbName || (igdbTitle && igdbName === igdbTitle))
                        return null;
                      return (
                        <p className="mt-2 text-xs text-apex-text/55">
                          <span className="text-apex-text/40">
                            Nome (IGDB):{" "}
                          </span>
                          {igdbName}
                        </p>
                      );
                    })()}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-apex-text/55">
                      <span>
                        <span className="text-apex-text/40">slug: </span>
                        <code className="text-apex-text/70">
                          {igdbMeta.slug}
                        </code>
                      </span>
                      {igdbMeta.igdb_game_id ? (
                        <span>
                          <span className="text-apex-text/40">id: </span>
                          <code className="text-apex-text/70">
                            {igdbMeta.igdb_game_id}
                          </code>
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Right — preview + config */}
              <div className="space-y-5">
                {/* Preview card — aspecto 1060:9, reativo ao campo manual "URL da Imagem de Capa" */}
                <section className="rounded-xl border border-apex-accent/10 bg-apex-surface p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.02)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-apex-text-muted">
                    Preview da capa
                  </p>
                  <p className="mt-0.5 text-[11px] text-apex-text/40">
                    Proporção 1060:9 — imagens de qualquer resolução são redimensionadas
                  </p>
                  <div className="relative mt-3 flex justify-center">
                    <div className="group relative w-full overflow-hidden rounded-lg border border-apex-primary/15 bg-apex-bg shadow-[0_4px_20px_rgb(0,0,0,0.4)] transition-all duration-300 hover:border-apex-secondary/40 hover:shadow-[0_6px_28px_rgb(0,0,0,0.5),0_0_0_1px_rgba(255,179,0,0.15)]">
                      <div
                        className={`relative aspect-[1060/9] w-full transition-opacity ${isFetchingIgdb ? "opacity-40" : ""}`}
                      >
                        {imageUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element -- URL editável (qualquer host) */}
                            <img
                              src={imageUrl}
                              alt=""
                              aria-hidden
                              className="pointer-events-none absolute inset-0 size-full scale-110 object-cover object-center opacity-30 blur-2xl"
                            />
                            {/* eslint-disable-next-line @next/next/no-img-element -- URL editável (qualquer host) */}
                            <img
                              src={imageUrl}
                              alt={title || "Capa do jogo"}
                              className="absolute inset-0 z-10 size-full object-cover object-center drop-shadow-[0_6px_20px_rgba(0,0,0,0.7)] ring-1 ring-apex-secondary/25"
                            />
                          </>
                        ) : (
                          <div className="flex size-full min-h-0 items-center justify-center px-3 py-8 text-center text-sm text-apex-text/40">
                            Busque no IGDB ou cole uma URL de imagem
                          </div>
                        )}
                      </div>
                      {isFetchingIgdb ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-lg bg-apex-bg/80 backdrop-blur-sm">
                          <div className="relative">
                            <span className="absolute inset-0 animate-ping rounded-full bg-apex-accent/15" />
                            <Wand2
                              className="relative size-8 animate-pulse text-apex-accent"
                              aria-hidden
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1 px-4 text-center">
                            <p
                              key={igdbStep}
                              className="text-xs font-semibold text-apex-accent/85"
                            >
                              {IGDB_LOADING_STEPS[igdbStep]}
                            </p>
                            <div className="mt-1 flex gap-1">
                              {IGDB_LOADING_STEPS.map((_, i) => (
                                <span
                                  key={i}
                                  className={`block h-[3px] w-4 rounded-full transition-all duration-500 ${
                                    i <= igdbStep
                                      ? "bg-apex-accent/80"
                                      : "bg-apex-text-muted/25"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {title ? (
                    <p className="mt-3 truncate text-center text-sm font-semibold text-apex-text/90">
                      {title}
                    </p>
                  ) : null}
                </section>

                {/* Config card — YouTube + price + tickets + submit */}
                <section className="rounded-xl border border-apex-primary/20 bg-apex-surface p-5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-apex-text-muted">
                    Configuração financeira
                  </p>
                  <div className="space-y-4">
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
                        placeholder="Cole a URL ou o ID do vídeo (ex: dQw4w9WgXcQ)"
                      />
                    </label>

                    {/* Preview do vídeo YouTube — reativo ao campo acima */}
                    {videoIdForApi(videoId) ? (
                      <div className="overflow-hidden rounded-lg border border-apex-primary/15 bg-apex-bg">
                        <p className="border-b border-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-apex-text-muted">
                          Preview do vídeo
                        </p>
                        <div className="relative aspect-video w-full">
                          <iframe
                            title="Preview do vídeo do YouTube"
                            src={`https://www.youtube.com/embed/${videoIdForApi(videoId)}?rel=0`}
                            className="absolute inset-0 size-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-apex-primary/20 bg-apex-bg/50">
                        <p className="text-center text-xs text-apex-text/40">
                          Cole a URL do YouTube para ver o preview
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-apex-text/85">
                          Preço total (R$)
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
                          placeholder="300"
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
                    </div>

                    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-stretch">
                      <button
                        type="submit"
                        disabled={isLoading || isFetchingIgdb || isTranslatingMeta}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-apex-accent to-teal-500 py-3 font-bold text-apex-bg shadow-[0_4px_16px_rgba(0,229,255,0.3)] transition-all hover:shadow-[0_6px_22px_rgba(0,229,255,0.4)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isEditing ? (
                          <Check className="size-5 shrink-0" aria-hidden />
                        ) : (
                          <Plus className="size-5 shrink-0" aria-hidden />
                        )}
                        {isLoading
                          ? "Processando…"
                          : isTranslatingMeta
                            ? "Traduzindo metadados…"
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
                            ? "text-center text-sm text-apex-success"
                            : "text-center text-sm text-red-400"
                        }
                      >
                        {message.text}
                      </p>
                    ) : null}
                  </div>
                </section>
              </div>
            </form>
          ) : null}

          {/* ── TAB: GESTÃO DE RIFAS ─────────────────────────── */}
          {activeTab === "raffles" ? (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                  title="Rifas Ativas"
                  value={activeRafflesCount}
                  icon={Activity}
                  accentClass="text-emerald-400"
                />
                <StatCard
                  title="Arrecadado Total"
                  value={formatBrl(totalCollected)}
                  icon={TrendingUp}
                  accentClass="text-apex-accent"
                />
                <StatCard
                  title="Bilhetes Vendidos"
                  value={totalSoldTickets}
                  icon={Hash}
                  accentClass="text-apex-secondary"
                />
                <StatCard
                  title="Aguardando PIX"
                  value={totalPendingPix}
                  icon={Clock}
                  accentClass="text-amber-400"
                />
              </div>

              {/* Table */}
              <section className="rounded-xl border border-apex-primary/20 bg-apex-surface shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                {rafflesDeleteError ? (
                  <p
                    role="alert"
                    className="px-5 pt-4 text-sm text-red-400/90"
                  >
                    {rafflesDeleteError}
                  </p>
                ) : null}
                <div className="overflow-x-auto rounded-xl">
                  <table className="w-full min-w-[920px] border-collapse text-left">
                    <thead>
                      <tr className="bg-apex-bg/50">
                        <th className={thClass}>Jogo / Título</th>
                        <th className={`${thClass} min-w-[140px]`}>
                          Progresso
                        </th>
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
                                      className="size-full object-cover object-center"
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
                            <td
                              className={`${tdClass} font-medium tabular-nums text-apex-text`}
                            >
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
                                  className="rounded-md p-2 text-apex-text-muted transition-colors hover:bg-apex-accent/5 hover:text-apex-accent"
                                  aria-label="Editar dados da rifa"
                                >
                                  <Edit className="size-4" aria-hidden />
                                </button>
                                <div className="relative inline-flex">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyRafflePublicLink(raffle.id)
                                    }
                                    className="rounded-md p-2 text-apex-text-muted transition-colors hover:bg-apex-accent/5 hover:text-apex-accent"
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
                                  className="rounded-md p-2 text-apex-text-muted transition-colors hover:bg-apex-secondary/5 hover:text-apex-secondary"
                                  aria-label={
                                    raffle.paused
                                      ? "Retomar rifa"
                                      : "Pausar rifa"
                                  }
                                >
                                  <CirclePause
                                    className="size-4"
                                    aria-hidden
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDeleteRaffle(raffle.id)
                                  }
                                  disabled={deletingRaffleId === raffle.id}
                                  className="rounded-md p-2 text-apex-text-muted transition-colors hover:bg-red-500/8 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Apagar rifa"
                                >
                                  {deletingRaffleId === raffle.id ? (
                                    <Loader2
                                      className="size-4 animate-spin"
                                      aria-hidden
                                    />
                                  ) : (
                                    <Trash2 className="size-4" aria-hidden />
                                  )}
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
            </div>
          ) : null}

          {/* ── TAB: TRANSAÇÕES ──────────────────────────────── */}
          {activeTab === "transactions" ? (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                  title="Total Transações"
                  value={txns.length}
                  icon={ReceiptText}
                  accentClass="text-apex-accent"
                />
                <StatCard
                  title="Aguardando"
                  value={pendingTxnsCount}
                  icon={Clock}
                  accentClass="text-amber-400"
                />
                <StatCard
                  title="Aprovados"
                  value={paidTxnsCount}
                  icon={BadgeCheck}
                  accentClass="text-emerald-400"
                />
                <StatCard
                  title="Cancelados"
                  value={expiredTxnsCount}
                  icon={XCircle}
                  accentClass="text-red-400"
                />
              </div>

              {/* Table */}
              <section className="rounded-xl border border-apex-primary/20 bg-apex-surface shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                <div className="overflow-x-auto rounded-xl">
                  <table className="w-full min-w-[860px] border-collapse text-left">
                    <thead>
                      <tr className="bg-apex-bg/50">
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
                            <span className="line-clamp-2">
                              {t.raffleTitle}
                            </span>
                          </td>
                          <td
                            className={`${tdClass} font-mono text-xs text-apex-accent/90`}
                          >
                            {t.numbersLabel}
                          </td>
                          <td
                            className={`${tdClass} font-medium tabular-nums`}
                          >
                            {t.amountLabel}
                          </td>
                          <td className={tdClass}>
                            <span
                              className={`text-sm font-medium ${txnStatusClass(t.status)}`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className={`${tdClass} text-right`}>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={
                                  t.status !== "Aguardando Pagamento"
                                }
                                onClick={() => approveTxn(t.id)}
                                className="rounded-lg border border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-400/95 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                Aprovar Manualmente
                              </button>
                              <button
                                type="button"
                                disabled={
                                  t.status !== "Aguardando Pagamento"
                                }
                                onClick={() => cancelTxnRelease(t.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-500/45 px-2.5 py-1.5 text-xs font-semibold text-red-400/95 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-35"
                              >
                                <XCircle
                                  className="size-3.5 shrink-0"
                                  aria-hidden
                                />
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
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}
