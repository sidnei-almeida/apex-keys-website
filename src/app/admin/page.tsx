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
  Play,
  Plus,
  ReceiptText,
  Rocket,
  ShieldAlert,
  Star,
  TableProperties,
  Trash2,
  TrendingUp,
  Wand2,
  XCircle,
} from "lucide-react";
import type React from "react";
import { ApiError } from "@/lib/api/http";
import {
  adminCancelReservation,
  adminConfirmReservation,
  adminDeleteRaffle,
  adminDeleteRaffleTransactionRecord,
  adminListReservations,
  adminPatchFeaturedTier,
  getRaffles,
} from "@/lib/api/services";
import { apiUrl, getApiBaseUrl } from "@/lib/api/config";
import { translateLabelList, translateToPtBr } from "@/lib/translate/client";
import { getAccessToken } from "@/lib/auth/token-storage";
import {
  dailymotionEmbedSrc,
  extractDailymotionVideoId,
  videoIdForApi,
} from "@/lib/video-embed";
import { fetchIgdbGame } from "@/services/api";
import type {
  AdminReservationRowOut,
  FeaturedTier,
  IgdbGameInfoResponse,
  RaffleListOut,
  RafflePublic,
} from "@/types/api";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

function ReservationTtlCountdown({ expiresAtIso }: { expiresAtIso: string }) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const end = Date.parse(expiresAtIso);
  if (Number.isNaN(end)) return null;
  if (nowMs === null) {
    return (
      <span className="text-xs tabular-nums text-premium-muted/55">…</span>
    );
  }
  const secLeft = Math.max(0, Math.floor((end - nowMs) / 1000));
  const m = Math.ceil(secLeft / 60);
  if (m <= 0) {
    return (
      <span className="text-xs text-amber-300/90">a libertar em breve</span>
    );
  }
  if (m === 1) {
    return <span className="text-xs text-amber-300/90">~1 min restante</span>;
  }
  return (
    <span className="text-xs tabular-nums text-premium-muted/75">
      ~{m} min para libertar
    </span>
  );
}

const inputClass =
  "w-full rounded-lg border border-premium-border bg-premium-surface px-3 py-2.5 text-premium-text placeholder:text-premium-muted/50 focus:border-premium-accent focus:outline-none focus:ring-1 focus:ring-premium-accent/35";

const IGDB_LOADING_STEPS = [
  "Conectando ao IGDB…",
  "Scraper iniciado — aguardando servidor…",
  "Coletando metadados do jogo…",
  "Processando informações…",
  "Quase lá, finalizando…",
] as const;

const thClass =
  "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-premium-text";
const tdClass = "px-3 py-3 align-middle text-sm text-premium-text";
const rowClass =
  "border-t border-premium-border bg-premium-bg transition-colors hover:bg-[#111111]";

type AdminTab = "launch" | "raffles" | "transactions";

type MockRaffle = {
  id: string;
  title: string;
  priceLabel: string;
  sold: number;
  total: number;
  status: string;
  featuredTier: FeaturedTier;
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
  rowKind: "active" | "archived";
  id: string;
  holdId: string | null;
  transactionId: string | null;
  clientName: string;
  clientEmail: string;
  raffleTitle: string;
  numbersLabel: string;
  amountLabel: string;
  amountNum: number;
  statusLabel: string;
  paymentChannel:
    | "pix"
    | "pix_mp"
    | "wallet"
    | "wallet_pending"
    | "none"
    | "pix_mp_wallet";
  gatewayRef: string | null;
  expiresAtIso: string | null;
  /** ISO — retenção mínima 14 dias antes de eliminar registo (alinhado à API). */
  createdAtIso: string;
};

function raffleImageUrl(url: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  const u = url.trim();
  if (u.startsWith("http")) return u;
  const base = getApiBaseUrl().replace(/\/+$/, "");
  return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
}

function mapAdminPanelReservationRow(r: AdminReservationRowOut): PendingTxnRow {
  const amountNum = parseFloat(r.total_amount);
  const safe = Number.isFinite(amountNum) ? amountNum : 0;
  const nums = (r.ticket_numbers ?? []).map((n) => `#${n}`).join(", ");
  if (r.row_kind === "archived") {
    const st =
      r.transaction_status === "failed"
        ? "Falha / recusado (MP)"
        : r.transaction_status === "canceled"
          ? "Cancelado (auditoria)"
          : r.transaction_status === "completed"
            ? "Pago (concluído)"
            : "Arquivo";
    return {
      rowKind: "archived",
      id: r.transaction_id ?? "",
      holdId: r.payment_hold_id,
      transactionId: r.transaction_id,
      clientName: r.user_name,
      clientEmail: r.user_email,
      raffleTitle: r.raffle_title,
      numbersLabel: nums || "—",
      amountLabel: `R$ ${safe.toFixed(2).replace(".", ",")}`,
      amountNum: safe,
      statusLabel: st,
      paymentChannel: r.payment_channel,
      gatewayRef: r.gateway_reference,
      expiresAtIso: null,
      createdAtIso: r.created_at,
    };
  }
  return {
    rowKind: "active",
    id: r.payment_hold_id ?? "",
    holdId: r.payment_hold_id ?? null,
    transactionId: r.transaction_id,
    clientName: r.user_name,
    clientEmail: r.user_email,
    raffleTitle: r.raffle_title,
    numbersLabel: nums,
    amountLabel: `R$ ${safe.toFixed(2).replace(".", ",")}`,
    amountNum: safe,
    statusLabel: "Aguardando pagamento",
    paymentChannel: r.payment_channel,
    gatewayRef: r.gateway_reference,
    expiresAtIso: r.expires_at,
    createdAtIso: r.created_at,
  };
}

const TXN_AUDIT_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

function isTxnDeletionEligible(createdAtIso: string): boolean {
  const t = Date.parse(createdAtIso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t >= TXN_AUDIT_RETENTION_MS;
}

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
    return "border-premium-border bg-[#1c1c1c] text-premium-accent";
  if (status === "Pausada")
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400/95";
  return "border-premium-border bg-[#141414] text-premium-muted";
}

function txnStatusClass(s: string): string {
  if (s === "Pago") return "text-emerald-400/95";
  if (s.startsWith("Pago")) return "text-emerald-400/95";
  if (s === "Aguardando pagamento") return "text-amber-400/95";
  if (s.startsWith("Cancelado")) return "text-premium-muted";
  if (s.startsWith("Falha")) return "text-red-400/90";
  return "text-premium-muted";
}

function channelLabel(row: PendingTxnRow): string {
  const ch = row.paymentChannel;
  if (
    row.rowKind === "archived" &&
    row.statusLabel.startsWith("Pago") &&
    ch === "none"
  ) {
    return "Aprovação manual (QG)";
  }
  if (ch === "wallet") return "Carteira";
  if (ch === "pix_mp_wallet") return "Pix (MP) + Carteira";
  if (ch === "pix" || ch === "pix_mp") return "Pix (MP)";
  if (ch === "wallet_pending")
    return "Reserva (sem Pix) — pode pagar na carteira";
  return "—";
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
      <p className="text-[10px] font-semibold uppercase tracking-wide text-premium-muted/60">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((x, i) => (
          <span
            key={`${label}-${i}-${x}`}
            className="rounded-md border border-premium-border bg-premium-bg px-2 py-0.5 text-xs text-premium-muted"
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
  accentClass = "text-premium-accent",
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  accentClass?: string;
}) {
  return (
    <div className="rounded-xl border border-premium-border bg-premium-surface p-5 shadow-none">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-premium-muted">
          {title}
        </p>
        <div className="shrink-0 rounded-md border border-premium-border bg-premium-bg p-1.5">
          <Icon className={`size-4 ${accentClass}`} aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-premium-text">
        {value}
      </p>
    </div>
  );
}

const DEFAULT_FEATURED_TIER: FeaturedTier = "none";

function mapRafflePublicToRow(r: RafflePublic): MockRaffle {
  const ticket = parseFloat(r.ticket_price);
  const priceLabel = Number.isFinite(ticket)
    ? `R$ ${ticket.toFixed(2).replace(".", ",")}`
    : `R$ ${r.ticket_price}`;
  const totalPriceNum = parseFloat(r.total_price);
  const tier =
    r.featured_tier === "featured" || r.featured_tier === "carousel"
      ? r.featured_tier
      : DEFAULT_FEATURED_TIER;
  return {
    id: r.id,
    title: r.title,
    priceLabel,
    sold: 0,
    total: r.total_tickets,
    status: r.status,
    featuredTier: tier,
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

function mapRaffleListOutToRow(r: RaffleListOut): MockRaffle {
  const base = mapRafflePublicToRow(r);
  return {
    ...base,
    sold: r.sold,
    reservedPending: r.held ?? 0,
    coverUrl: raffleImageUrl(r.image_url) ?? base.coverUrl,
    featuredTier:
      r.featured_tier === "featured" || r.featured_tier === "carousel"
        ? r.featured_tier
        : DEFAULT_FEATURED_TIER,
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

const ADMIN_TAB_STORAGE_KEY = "apex-qg-active-tab";

function isValidAdminTab(s: string | null): s is AdminTab {
  return s === "launch" || s === "raffles" || s === "transactions";
}

function AdminPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTabState] = useState<AdminTab>("launch");

  const selectTab = useCallback(
    (tab: AdminTab) => {
      setActiveTabState(tab);
      try {
        sessionStorage.setItem(ADMIN_TAB_STORAGE_KEY, tab);
      } catch {
        /* modo privado / quota */
      }
      const current = searchParams.get("tab");
      if (current !== tab) {
        router.replace(`${pathname}?tab=${tab}`, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  useLayoutEffect(() => {
    const q = searchParams.get("tab");
    if (isValidAdminTab(q)) {
      setActiveTabState((prev) => (prev === q ? prev : q));
      try {
        sessionStorage.setItem(ADMIN_TAB_STORAGE_KEY, q);
      } catch {
        /* */
      }
      return;
    }
    try {
      const stored = sessionStorage.getItem(ADMIN_TAB_STORAGE_KEY);
      if (isValidAdminTab(stored)) {
        setActiveTabState(stored);
        router.replace(`${pathname}?tab=${stored}`, { scroll: false });
      }
    } catch {
      /* */
    }
  }, [pathname, router, searchParams]);

  const [raffles, setRaffles] = useState<MockRaffle[]>([]);
  const [rafflesLoading, setRafflesLoading] = useState(true);
  const [txns, setTxns] = useState<PendingTxnRow[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [txnActionId, setTxnActionId] = useState<string | null>(null);

  const reloadReservationRows = useCallback(async (opts?: { silent?: boolean }) => {
    const token = getAccessToken();
    if (!token) {
      setTxns([]);
      return;
    }
    if (!opts?.silent) setTxnsLoading(true);
    try {
      const panel = await adminListReservations(token);
      setTxns([
        ...panel.active.map(mapAdminPanelReservationRow),
        ...panel.archived.map(mapAdminPanelReservationRow),
      ]);
    } catch {
      setTxns([]);
    } finally {
      if (!opts?.silent) setTxnsLoading(false);
    }
  }, []);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [featuredTier, setFeaturedTier] = useState<FeaturedTier>(
    DEFAULT_FEATURED_TIER,
  );
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
  const [patchingFeaturedTierId, setPatchingFeaturedTierId] = useState<
    string | null
  >(null);
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

  useEffect(() => {
    let cancelled = false;
    setRafflesLoading(true);
    getRaffles()
      .then((list) => {
        if (!cancelled) {
          setRaffles(list.map(mapRaffleListOutToRow));
        }
      })
      .catch(() => {
        if (!cancelled) setRaffles([]);
      })
      .finally(() => {
        if (!cancelled) setRafflesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "transactions") return;
    let cancelled = false;
    void (async () => {
      await reloadReservationRows();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, reloadReservationRows]);

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
    setFeaturedTier(DEFAULT_FEATURED_TIER);
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
    selectTab("launch");
    setEditingRaffleId(raffle.id);
    setTitle(raffle.title);
    setImageUrl(
      (raffle.imageUrlRaw?.trim() || raffle.coverUrl || "").trim(),
    );
    setVideoId((raffle.videoId ?? "").trim());
    setFeaturedTier(raffle.featuredTier ?? DEFAULT_FEATURED_TIER);
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
  }, [selectTab]);

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

  const approveTxn = useCallback(
    async (holdId: string) => {
      const token = getAccessToken();
      if (!token) {
        setMessage({
          type: "error",
          text: "Faça login novamente para aprovar reservas.",
        });
        return;
      }
      setTxnActionId(holdId);
      try {
        await adminConfirmReservation(token, holdId);
        setMessage({
          type: "success",
          text: "Reserva aprovada manualmente. Bilhetes marcados como pagos.",
        });
        await reloadReservationRows({ silent: true });
        void getRaffles().then((list) =>
          setRaffles(list.map(mapRaffleListOutToRow)),
        );
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? (err.detail ?? err.message)
            : err instanceof Error
              ? err.message
              : "Falha ao confirmar reserva.";
        setMessage({ type: "error", text: msg });
      } finally {
        setTxnActionId(null);
      }
    },
    [reloadReservationRows],
  );

  const cancelTxnRelease = useCallback(
    async (holdId: string) => {
      const token = getAccessToken();
      if (!token) {
        setMessage({
          type: "error",
          text: "Faça login novamente para libertar números.",
        });
        return;
      }
      setTxnActionId(holdId);
      try {
        await adminCancelReservation(token, holdId);
        setMessage({
          type: "success",
          text: "Reserva cancelada: números libertados; registo Pix mantido como cancelado (auditoria).",
        });
        await reloadReservationRows({ silent: true });
        void getRaffles().then((list) =>
          setRaffles(list.map(mapRaffleListOutToRow)),
        );
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? (err.detail ?? err.message)
            : err instanceof Error
              ? err.message
              : "Falha ao cancelar reserva.";
        setMessage({ type: "error", text: msg });
      } finally {
        setTxnActionId(null);
      }
    },
    [reloadReservationRows],
  );

  const deleteArchivedTxnRecord = useCallback(
    async (transactionId: string) => {
      const token = getAccessToken();
      if (!token) {
        setMessage({
          type: "error",
          text: "Faça login novamente.",
        });
        return;
      }
      setTxnActionId(transactionId);
      try {
        await adminDeleteRaffleTransactionRecord(token, transactionId);
        setMessage({
          type: "success",
          text: "Registo eliminado após o período de retenção de 14 dias.",
        });
        await reloadReservationRows({ silent: true });
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? (err.detail ?? err.message)
            : err instanceof Error
              ? err.message
              : "Falha ao eliminar registo.";
        setMessage({ type: "error", text: msg });
      } finally {
        setTxnActionId(null);
      }
    },
    [reloadReservationRows],
  );

  const buildRafflePayload = useCallback((r: MockRaffle, tier: FeaturedTier) => {
    const payload: Record<string, unknown> = {
      title: r.title,
      image_url: r.imageUrlRaw?.trim() || null,
      video_id: videoIdForApi(r.videoId ?? ""),
      total_price: r.totalPriceNum ?? 0,
      total_tickets: r.total,
      featured_tier: tier,
    };
    if (r.summaryPt) payload.summary = r.summaryPt;
    if (r.genresPt?.length) payload.genres = r.genresPt;
    if (r.seriesPt?.length) payload.series = r.seriesPt;
    if (r.gameModesPt?.length) payload.game_modes = r.gameModesPt;
    if (r.perspectivesPt?.length) payload.player_perspectives = r.perspectivesPt;
    return JSON.stringify(payload);
  }, []);

  /** Cicla featured_tier na tabela: none -> carousel -> featured -> none (via PATCH) */
  const handleStarClick = useCallback(
    async (raffle: MockRaffle) => {
      const next: FeaturedTier =
        raffle.featuredTier === "none"
          ? "carousel"
          : raffle.featuredTier === "carousel"
            ? "featured"
            : "none";
      const token = getAccessToken();
      if (!token) return;
      setPatchingFeaturedTierId(raffle.id);
      setMessage(null);
      try {
        await adminPatchFeaturedTier(token, raffle.id, next);
        setRaffles((prev) =>
          prev.map((r) =>
            r.id === raffle.id ? { ...r, featuredTier: next } : r,
          ),
        );
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.detail ?? err.message
            : err instanceof Error
              ? err.message
              : "Não foi possível alterar o destaque.";
        setMessage({ type: "error", text: msg });
      } finally {
        setPatchingFeaturedTierId(null);
      }
    },
    [],
  );

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
      const igdbRef = igdbMeta?.igdb_url?.trim();
      if (igdbRef) bodyPayload.igdb_url = igdbRef;
      const igdbId = igdbMeta?.igdb_game_id?.trim();
      if (igdbId) bodyPayload.igdb_game_id = igdbId;
      bodyPayload.featured_tier = featuredTier;

      const url = editingRaffleId
        ? apiUrl(`/api/v1/admin/raffles/${editingRaffleId}`)
        : apiUrl("/api/v1/admin/raffles");

      const body = JSON.stringify(bodyPayload);
      const res = await fetch(url, {
        method: editingRaffleId ? "PUT" : "POST",
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
  const activeTxnRows = txns.filter((t) => t.rowKind === "active");
  const archivedTxnCount = txns.filter((t) => t.rowKind === "archived").length;
  const pendingTxnsCount = activeTxnRows.length;
  const pixPendingCount = activeTxnRows.filter(
    (t) => t.paymentChannel === "pix" || t.paymentChannel === "pix_mp",
  ).length;
  const walletHoldCount = activeTxnRows.filter(
    (t) => t.paymentChannel === "wallet_pending",
  ).length;
  const totalReservedBrl = activeTxnRows.reduce(
    (acc, t) => acc + t.amountNum,
    0,
  );

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
        : "Pagamentos concluídos ficam no histórico; eliminar só após 14 dias (retenção).";

  return (
    <div className="relative isolate -mb-8 flex min-h-[calc(100vh-4rem)] bg-premium-bg">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_45%_at_50%_-8%,rgba(212,175,55,0.035)_0%,transparent_55%)]"
        aria-hidden
      />

      {/* ── SIDEBAR ────────────────────────────────────────────── */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-premium-border/25 bg-premium-bg lg:flex">
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-premium-border/25 px-5 py-5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-premium-border bg-premium-surface text-premium-accent">
            <ShieldAlert className="size-4" aria-hidden />
          </div>
          <span className="font-bold tracking-tight text-premium-text">
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
                onClick={() => selectTab(id)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-premium-surface/80 text-premium-accent"
                    : "text-premium-muted hover:bg-premium-surface/50 hover:text-premium-text"
                }`}
              >
                {active && (
                  <span
                    className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-premium-accent"
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
        <div className="border-t border-premium-border/25 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-premium-muted transition-colors hover:text-premium-accent"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Voltar ao Site
          </Link>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE ─────────────────────────────────────── */}
      <div className="relative z-0 flex min-w-0 flex-1 flex-col">

        {/* Mobile tab bar (< lg) */}
        <nav
          className="flex flex-wrap gap-1 border-b border-premium-border/25 bg-premium-bg px-4 py-2 lg:hidden"
          aria-label="Secções do painel"
        >
          {TAB_DEF.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "border-premium-accent text-premium-accent"
                    : "border-transparent text-premium-muted hover:text-premium-text"
                }`}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Inner header (desktop) */}
        <header className="sticky top-16 z-10 hidden items-center justify-between border-b border-premium-border/25 bg-premium-bg px-6 py-4 lg:flex">
          <div>
            <h1 className="text-base font-bold text-premium-text lg:text-lg">
              {innerTitle}
            </h1>
            <p className="text-xs text-premium-muted">{innerSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === "launch" && isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-sm text-premium-muted transition-colors hover:text-red-400"
              >
                Cancelar edição
              </button>
            )}
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-sm text-premium-muted transition-colors hover:text-premium-accent xl:flex"
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
              className="grid min-h-0 grid-cols-1 gap-4 lg:max-h-[calc(100vh-8rem)] lg:grid-cols-2 lg:items-stretch"
            >
              {/* Left — formulário compacto, scroll interno */}
              <div className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border border-premium-border bg-premium-surface p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* IGDB URL */}
                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-premium-text">
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
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-premium-border px-4 py-2 text-sm font-semibold text-premium-muted transition-colors hover:border-premium-accent hover:text-premium-text disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {isFetchingIgdb ? (
                          <Loader2
                            className="size-4 shrink-0 animate-spin text-premium-accent"
                            aria-hidden
                          />
                        ) : (
                          <Wand2
                            className="size-4 shrink-0 text-premium-accent"
                            aria-hidden
                          />
                        )}
                        {isFetchingIgdb ? "Buscando…" : "Buscar Dados"}
                      </button>
                    </div>

                    {isFetchingIgdb ? (
                      <div
                        role="status"
                        aria-live="polite"
                        className="mt-3 flex items-center gap-3 rounded-lg border border-premium-border bg-premium-bg px-4 py-3"
                      >
                        <div className="relative shrink-0">
                          <span className="absolute inset-0 animate-ping rounded-full bg-premium-accent/12" />
                          <Wand2
                            className="relative size-4 text-premium-accent/90"
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            key={igdbStep}
                            className="text-sm font-medium text-premium-accent"
                          >
                            {IGDB_LOADING_STEPS[igdbStep]}
                          </p>
                          <p className="mt-0.5 text-xs text-premium-muted">
                            O scraper pode levar até 10 s na primeira tentativa
                          </p>
                        </div>
                        <div className="ml-auto flex shrink-0 items-end gap-[3px] pb-[1px]">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="block w-[3px] animate-pulse rounded-full bg-premium-accent/40"
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
                    <span className="mb-1.5 block text-sm font-medium text-premium-text">
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
                    <span className="mb-1.5 block text-sm font-medium text-premium-text">
                      URL da Imagem de Capa
                    </span>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className={inputClass}
                      placeholder="Cole a URL da imagem de alta qualidade (ex: alphacoders.com)"
                    />
                    <p className="mt-1 text-[11px] text-premium-muted/65">
                      Inserir manualmente — use imagens de alta qualidade do AlphaCoders ou similar.
                    </p>
                  </label>

                  {/* Destaque na Home */}
                  <div className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-medium text-premium-text">
                      Exibição na Home
                    </span>
                    <div className="flex items-center gap-2">
                      {(
                        [
                          {
                            tier: "featured" as const,
                            label: "Destaque (topo)",
                            className: "text-amber-400 fill-amber-400",
                          },
                          {
                            tier: "carousel" as const,
                            label: "Carrossel",
                            className: "text-slate-400 fill-slate-400",
                          },
                          {
                            tier: "none" as const,
                            label: "Só em Rifas",
                            className: "text-premium-muted/50",
                          },
                        ] as const
                      ).map(({ tier, label, className }) => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setFeaturedTier(tier)}
                          title={label}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            featuredTier === tier
                              ? "border-premium-accent/55 bg-premium-accent/12"
                              : "border-premium-border hover:border-premium-muted/45"
                          }`}
                        >
                          <Star
                            className={`size-4 shrink-0 ${
                              tier === "none" ? "opacity-40" : className
                            }`}
                            fill={tier === "none" ? "none" : "currentColor"}
                            strokeWidth={tier === "none" ? 1.5 : 0}
                            aria-hidden
                          />
                          <span className="text-premium-text">{label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] text-premium-muted/65">
                      Ouro = hero no topo (várias possíveis; rotação lenta na home) · Prata =
                      carrossel · Vazio = só na aba Rifas
                    </p>
                  </div>
                </div>

                {/* Traduzindo */}
                {isTranslatingMeta ? (
                  <p className="flex items-center gap-2 text-sm text-premium-accent">
                    <Loader2
                      className="size-4 shrink-0 animate-spin"
                      aria-hidden
                    />
                    A traduzir resumo e rótulos (EN → pt-BR)…
                  </p>
                ) : null}

                {/* Resumo */}
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-premium-text">
                    Resumo (trecho IGDB)
                  </span>
                  <div
                    className={`${inputClass} min-h-[3.5rem] max-h-[5rem] overflow-y-auto cursor-default bg-premium-surface text-premium-text`}
                    aria-readonly
                  >
                    {isTranslatingMeta ? (
                      <p className="text-sm text-premium-muted/65">…</p>
                    ) : summaryPt.trim() ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {summaryPt.trim()}
                      </p>
                    ) : (
                      <p className="text-sm text-premium-muted/70">
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
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-premium-accent transition-colors hover:text-premium-accent/85"
                      >
                        Ver mais no IGDB
                        <ExternalLink
                          className="size-3.5 shrink-0 text-premium-accent opacity-90"
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

                {/* Valores e lançamento — separado dos previews */}
                <div className="rounded-lg border border-premium-border bg-premium-bg p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-premium-muted">
                    Valores e lançamento
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-premium-text">
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
                      <span className="mb-1.5 block text-sm font-medium text-premium-text">
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
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <button
                      type="submit"
                      disabled={isLoading || isFetchingIgdb || isTranslatingMeta}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-premium-accent py-3 font-bold text-black transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="shrink-0 rounded-xl border border-premium-border bg-transparent px-5 py-3 text-sm font-medium text-premium-muted transition-colors hover:border-premium-muted/55 hover:bg-premium-bg hover:text-premium-text/90 disabled:cursor-not-allowed disabled:opacity-50"
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
                          ? "mt-3 text-center text-sm text-emerald-400/95"
                          : "mt-3 text-center text-sm text-red-400"
                      }
                    >
                      {message.text}
                    </p>
                  ) : null}
                </div>

                {/* IGDB ref */}
                {igdbMeta ? (
                  <div className="rounded-lg border border-premium-border bg-premium-surface p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-premium-muted">
                      Referência IGDB
                    </p>
                    {(() => {
                      const igdbName = igdbMeta.name?.trim();
                      const igdbTitle = igdbMeta.title?.trim();
                      if (!igdbName || (igdbTitle && igdbName === igdbTitle))
                        return null;
                      return (
                        <p className="mt-2 text-xs text-premium-muted">
                          <span className="text-premium-muted/65">
                            Nome (IGDB):{" "}
                          </span>
                          {igdbName}
                        </p>
                      );
                    })()}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-premium-muted">
                      <span>
                        <span className="text-premium-muted/65">slug: </span>
                        <code className="text-premium-muted/90">
                          {igdbMeta.slug}
                        </code>
                      </span>
                      {igdbMeta.igdb_game_id ? (
                        <span>
                          <span className="text-premium-muted/65">id: </span>
                          <code className="text-premium-muted/90">
                            {igdbMeta.igdb_game_id}
                          </code>
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Right — previews fixos, sempre visíveis (sticky) */}
              <div className="flex min-h-0 flex-col gap-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
                {/* Preview da capa */}
                <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-premium-border bg-premium-surface p-3">
                  <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-premium-muted">
                    Preview da capa
                  </p>
                  <div className="relative mt-2 min-h-0 flex-1">
                    <div className="group relative size-full overflow-hidden rounded-lg border border-premium-border bg-premium-bg transition-colors duration-300 hover:border-premium-accent/40">
                      <div
                        className={`relative size-full min-h-[120px] transition-opacity ${isFetchingIgdb ? "opacity-40" : ""}`}
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
                              className="absolute inset-0 z-10 size-full object-cover object-center drop-shadow-[0_6px_20px_rgba(0,0,0,0.7)] ring-1 ring-premium-accent/20"
                            />
                          </>
                        ) : (
                          <div className="flex size-full min-h-0 items-center justify-center px-3 py-8 text-center text-sm text-premium-muted/65">
                            Busque no IGDB ou cole uma URL de imagem
                          </div>
                        )}
                      </div>
                      {isFetchingIgdb ? (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-premium-bg/92">
                          <Wand2 className="size-6 animate-pulse text-premium-accent" aria-hidden />
                          <p key={igdbStep} className="text-xs font-medium text-premium-accent">
                            {IGDB_LOADING_STEPS[igdbStep]}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>

                {/* Preview do vídeo Dailymotion */}
                <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-premium-border bg-premium-surface p-3">
                  <label className="shrink-0">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-premium-muted">
                      Link do trailer no Dailymotion (opcional)
                    </span>
                    <input
                      type="text"
                      value={videoId}
                      onChange={(e) => {
                        const v = e.target.value;
                        const extracted = extractDailymotionVideoId(v);
                        setVideoId(extracted ?? v);
                      }}
                      onBlur={(e) => {
                        const v = e.target.value;
                        const extracted = extractDailymotionVideoId(v);
                        if (extracted) setVideoId(extracted);
                      }}
                      className={`${inputClass} py-2 text-sm`}
                      placeholder="URL ou ID (ex.: x8abcd ou dailymotion.com/video/…)"
                    />
                  </label>

                  <div className="relative mt-2 min-h-0 flex-1">
                    {videoIdForApi(videoId) ? (
                      <div className="absolute inset-0 overflow-hidden rounded-lg border border-premium-border bg-premium-bg">
                        <iframe
                          title="Preview do vídeo no Dailymotion"
                          src={dailymotionEmbedSrc(videoIdForApi(videoId)!)}
                          className="size-full"
                          allow="fullscreen; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="flex size-full min-h-[100px] items-center justify-center rounded-lg border border-dashed border-premium-border bg-premium-bg">
                        <p className="text-center text-xs text-premium-muted/65">
                          Cole a URL do Dailymotion para ver o preview
                        </p>
                      </div>
                    )}
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
                  accentClass="text-premium-accent"
                />
                <StatCard
                  title="Bilhetes Vendidos"
                  value={totalSoldTickets}
                  icon={Hash}
                  accentClass="text-premium-accent"
                />
                <StatCard
                  title="Aguardando"
                  value={totalPendingPix}
                  icon={Clock}
                  accentClass="text-premium-accent"
                />
              </div>

              {/* Table */}
              <section className="rounded-xl border border-premium-border bg-premium-surface">
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
                      <tr className="border-b border-premium-border bg-premium-surface">
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
                      {rafflesLoading ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-12 text-center text-premium-muted/80"
                          >
                            Carregando rifas…
                          </td>
                        </tr>
                      ) : (
                        raffles.map((raffle) => {
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
                                  <div className="relative size-10 shrink-0 overflow-hidden rounded-md border border-premium-border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={raffle.coverUrl}
                                      alt=""
                                      className="size-full object-cover object-center"
                                    />
                                  </div>
                                ) : (
                                  <div className="size-10 shrink-0 rounded-md border border-dashed border-premium-border bg-premium-bg" />
                                )}
                                <button
                                  type="button"
                                  className="shrink-0 rounded p-0.5 transition-opacity hover:opacity-80 disabled:opacity-50"
                                  title={
                                    raffle.featuredTier === "featured"
                                      ? "Destaque (topo) — clique para alternar"
                                      : raffle.featuredTier === "carousel"
                                        ? "Carrossel — clique para alternar"
                                        : "Só em Rifas — clique para alternar"
                                  }
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    void handleStarClick(raffle);
                                  }}
                                  disabled={patchingFeaturedTierId === raffle.id}
                                >
                                  {patchingFeaturedTierId === raffle.id ? (
                                    <Loader2
                                      className="size-4 animate-spin text-premium-accent"
                                      aria-hidden
                                    />
                                  ) : (
                                    <Star
                                      className={`size-4 ${
                                        raffle.featuredTier === "featured"
                                          ? "text-amber-400 fill-amber-400"
                                          : raffle.featuredTier === "carousel"
                                            ? "text-slate-400 fill-slate-400"
                                            : "text-premium-muted/35"
                                      }`}
                                      fill={
                                        raffle.featuredTier === "none"
                                          ? "none"
                                          : "currentColor"
                                      }
                                      strokeWidth={
                                        raffle.featuredTier === "none"
                                          ? 1.5
                                          : 0
                                      }
                                      aria-hidden
                                    />
                                  )}
                                </button>
                                <span className="min-w-0 font-medium text-premium-text">
                                  {raffle.title}
                                </span>
                              </div>
                            </td>
                            <td className={tdClass}>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs tabular-nums text-premium-accent">
                                  {raffle.sold}/{raffle.total}
                                </span>
                                <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full border border-premium-border bg-premium-bg">
                                  <div
                                    className="h-full rounded-full bg-premium-accent"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className={`${tdClass} text-premium-muted`}>
                              {raffle.reservedPending} aguardando
                            </td>
                            <td className={`${tdClass} text-premium-text/90`}>
                              <span className="text-premium-text/85">
                                {raffle.priceLabel}
                              </span>
                              <span className="text-premium-muted/50"> · </span>
                              <span className="tabular-nums text-premium-muted/80">
                                {raffle.totalPriceNum != null
                                  ? formatBrl(raffle.totalPriceNum)
                                  : "—"}
                              </span>
                            </td>
                            <td
                              className={`${tdClass} font-medium tabular-nums text-premium-text/90`}
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
                                  className="rounded-md border border-premium-border/40 bg-transparent p-2 text-premium-muted/55 transition-colors hover:border-premium-border/70 hover:text-premium-accent"
                                  aria-label="Editar dados da rifa"
                                  title="Editar rifa"
                                >
                                  <Edit className="size-4" aria-hidden />
                                </button>
                                <div className="relative inline-flex">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyRafflePublicLink(raffle.id)
                                    }
                                    className="rounded-md border border-premium-border/40 bg-transparent p-2 text-premium-muted/55 transition-colors hover:border-premium-border/70 hover:text-premium-text"
                                    aria-label="Copiar link público"
                                    title="Copiar link público"
                                  >
                                    <LinkIcon className="size-4" aria-hidden />
                                  </button>
                                  {copiedRaffleId === raffle.id ? (
                                    <span className="pointer-events-none absolute right-0 top-full z-10 mt-0.5 whitespace-nowrap rounded border border-premium-border/60 bg-premium-surface px-1.5 py-0.5 text-[10px] font-semibold text-premium-text">
                                      Copiado
                                    </span>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleRafflePause(raffle.id)}
                                  className={`rounded-md border border-premium-border/40 bg-transparent p-2 transition-colors hover:border-premium-border/70 ${
                                    raffle.paused
                                      ? "text-premium-muted/55 hover:text-emerald-400"
                                      : "text-premium-muted/55 hover:text-premium-text"
                                  }`}
                                  aria-label={
                                    raffle.paused
                                      ? "Retomar rifa"
                                      : "Pausar rifa"
                                  }
                                  title={
                                    raffle.paused
                                      ? "Retomar rifa"
                                      : "Pausar rifa"
                                  }
                                >
                                  {raffle.paused ? (
                                    <Play
                                      className="size-4"
                                      aria-hidden
                                      fill="currentColor"
                                    />
                                  ) : (
                                    <CirclePause
                                      className="size-4"
                                      aria-hidden
                                    />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDeleteRaffle(raffle.id)
                                  }
                                  disabled={deletingRaffleId === raffle.id}
                                  className="rounded-md border border-premium-border/40 bg-transparent p-2 text-premium-muted/55 transition-colors hover:border-red-900/55 hover:text-red-400/85 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label="Apagar rifa"
                                  title="Apagar rifa"
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
                      })
                      )}
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
                  title="Lista (ativas · arquivo)"
                  value={`${pendingTxnsCount} · ${archivedTxnCount}`}
                  icon={ReceiptText}
                  accentClass="text-premium-accent"
                />
                <StatCard
                  title="Pix (MP) pendente"
                  value={pixPendingCount}
                  icon={Clock}
                  accentClass="text-premium-accent"
                />
                <StatCard
                  title="Só reserva (carteira)"
                  value={walletHoldCount}
                  icon={BadgeCheck}
                  accentClass="text-premium-muted"
                />
                <StatCard
                  title="Valor em aberto"
                  value={formatBrl(totalReservedBrl)}
                  icon={TrendingUp}
                  accentClass="text-emerald-400"
                />
              </div>

              {/* Table */}
              <section className="rounded-xl border border-premium-border bg-premium-surface">
                <div className="overflow-x-auto rounded-xl">
                  <table className="w-full min-w-[960px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-premium-border bg-premium-surface">
                        <th className={thClass}>Cliente</th>
                        <th className={thClass}>Rifa</th>
                        <th className={thClass}>Números</th>
                        <th className={thClass}>Valor</th>
                        <th className={thClass}>Canal</th>
                        <th className={thClass}>Ref. Pix</th>
                        <th className={thClass}>Auto-liberta</th>
                        <th className={thClass}>Status</th>
                        <th className={`${thClass} text-right`}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txnsLoading ? (
                        <tr>
                          <td
                            colSpan={9}
                            className={`${tdClass} py-10 text-center text-premium-muted`}
                          >
                            <Loader2
                              className="mx-auto size-8 animate-spin text-premium-accent"
                              aria-hidden
                            />
                            <p className="mt-2 text-sm">A carregar reservas…</p>
                          </td>
                        </tr>
                      ) : txns.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className={`${tdClass} py-10 text-center text-premium-muted`}
                          >
                            Nenhuma reserva nem histórico. As novas aparecem quando
                            um jogador inicia o pagamento.
                          </td>
                        </tr>
                      ) : (
                        (() => {
                          const firstArch = txns.findIndex(
                            (x) => x.rowKind === "archived",
                          );
                          return txns.flatMap((t, i) => {
                            const sep =
                              i === firstArch && firstArch >= 0 ? (
                                <tr key="txn-sep-historico" className="bg-premium-surface/65">
                                  <td
                                    colSpan={9}
                                    className={`${tdClass} py-2.5 text-xs font-semibold uppercase tracking-wide text-premium-muted`}
                                  >
                                    Histórico (auditoria) — pago, cancelado ou falha.
                                    Eliminar registo: só após 14 dias (retenção).
                                  </td>
                                </tr>
                              ) : null;
                            const row = (
                              <tr
                                key={`${t.rowKind}-${t.id}`}
                                className={
                                  t.rowKind === "archived"
                                    ? `${rowClass} bg-[#0c0c0c]`
                                    : rowClass
                                }
                              >
                                <td className={tdClass}>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-premium-text">
                                      {t.clientName}
                                    </span>
                                    <span className="text-xs text-premium-muted/85">
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
                                  className={`${tdClass} font-mono text-xs text-premium-accent`}
                                >
                                  {t.numbersLabel}
                                </td>
                                <td
                                  className={`${tdClass} font-medium tabular-nums text-premium-accent`}
                                >
                                  {t.amountLabel}
                                </td>
                                <td className={`${tdClass} text-xs`}>
                                  {channelLabel(t)}
                                </td>
                                <td
                                  className={`${tdClass} max-w-[140px] truncate font-mono text-[10px] text-premium-muted`}
                                  title={t.gatewayRef ?? undefined}
                                >
                                  {t.gatewayRef
                                    ? `${t.gatewayRef.slice(0, 24)}${t.gatewayRef.length > 24 ? "…" : ""}`
                                    : "—"}
                                </td>
                                <td className={`${tdClass} align-top`}>
                                  {t.rowKind === "active" &&
                                  t.expiresAtIso ? (
                                    <ReservationTtlCountdown
                                      expiresAtIso={t.expiresAtIso}
                                    />
                                  ) : (
                                    <span className="text-xs text-premium-muted/70">
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className={tdClass}>
                                  <span
                                    className={`text-sm font-medium ${txnStatusClass(t.statusLabel)}`}
                                  >
                                    {t.statusLabel}
                                  </span>
                                </td>
                                <td className={`${tdClass} text-right`}>
                                  <div className="flex flex-wrap items-center justify-end gap-2">
                                    {t.rowKind === "active" ? (
                                      <>
                                        <button
                                          type="button"
                                          disabled={
                                            !t.holdId ||
                                            txnActionId === t.holdId
                                          }
                                          onClick={() =>
                                            t.holdId &&
                                            void approveTxn(t.holdId)
                                          }
                                          title="Aprovar pagamento"
                                          className="rounded-lg border border-premium-border/40 px-2.5 py-1.5 text-xs font-medium text-premium-muted/65 transition-colors hover:border-emerald-900/55 hover:text-emerald-400/85 disabled:cursor-not-allowed disabled:opacity-35"
                                        >
                                          Aprovar manualmente
                                        </button>
                                        <button
                                          type="button"
                                          disabled={
                                            !t.holdId ||
                                            txnActionId === t.holdId
                                          }
                                          onClick={() =>
                                            t.holdId &&
                                            void cancelTxnRelease(t.holdId)
                                          }
                                          title="Cancelar reserva"
                                          className="inline-flex items-center gap-1 rounded-lg border border-premium-border/40 px-2.5 py-1.5 text-xs font-medium text-premium-muted/65 transition-colors hover:border-premium-border/65 hover:text-premium-text/80 disabled:cursor-not-allowed disabled:opacity-35"
                                        >
                                          <XCircle
                                            className="size-3.5 shrink-0"
                                            aria-hidden
                                          />
                                          Cancelar reserva
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={
                                          !t.transactionId ||
                                          txnActionId === t.transactionId ||
                                          !isTxnDeletionEligible(t.createdAtIso)
                                        }
                                        title={
                                          !isTxnDeletionEligible(t.createdAtIso)
                                            ? "Retenção 14 dias"
                                            : "Eliminar registo"
                                        }
                                        onClick={() =>
                                          t.transactionId &&
                                          void deleteArchivedTxnRecord(
                                            t.transactionId,
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-premium-border/40 px-2.5 py-1.5 text-xs font-medium text-premium-muted/65 transition-colors hover:border-red-900/55 hover:text-red-400/80 disabled:cursor-not-allowed disabled:opacity-35"
                                      >
                                        <Trash2
                                          className="size-3.5 shrink-0"
                                          aria-hidden
                                        />
                                        Eliminar registo
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                            return sep ? [sep, row] : [row];
                          });
                        })()
                      )}
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

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="-mb-8 flex min-h-[calc(100vh-4rem)] items-center justify-center bg-premium-bg">
          <p className="flex items-center gap-2 text-sm text-premium-muted">
            <Loader2 className="size-4 animate-spin text-premium-accent" aria-hidden />
            A carregar painel…
          </p>
        </div>
      }
    >
      <AdminPanel />
    </Suspense>
  );
}
