"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/services";
import { getAccessToken } from "@/lib/auth/token-storage";
import type { NotificationOut } from "@/types/api";
import { Bell, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function formatNotificationDate(createdAt: string): string {
  const d = new Date(createdAt);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificacoesPage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const [notifications, setNotifications] = useState<NotificationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    getNotifications(token, { limit: 50 })
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, isReady, router]);

  const handleMarkAllRead = async () => {
    const token = getAccessToken();
    if (!token) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(token);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (n: NotificationOut) => {
    const token = getAccessToken();
    if (token && !n.read_at) {
      try {
        await markNotificationRead(token, n.id);
        setNotifications((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x
          )
        );
      } catch {
        // Ignorar
      }
    }
    router.push("/minhas-transacoes");
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  if (!isReady) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-apex-text">
          <Bell className="size-6 text-apex-accent" aria-hidden />
          Notificações
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            disabled={markingAll}
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-apex-accent hover:underline disabled:opacity-50"
          >
            {markingAll ? "Marcando…" : "Marcar todas como lidas"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-apex-accent" aria-hidden />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-apex-surface/50 p-12 text-center">
          <Bell className="mx-auto size-14 text-apex-text-muted/40" aria-hidden />
          <p className="mt-4 text-apex-text-muted/80">Nenhuma notificação</p>
          <Link
            href="/minhas-transacoes"
            className="mt-4 inline-block text-sm font-medium text-apex-accent hover:underline"
          >
            Ver transações
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-4 text-left transition-colors hover:border-apex-accent/30 ${
                  !n.read_at
                    ? "border-apex-accent/20 bg-apex-accent/5"
                    : "border-white/[0.06] bg-apex-surface/60"
                }`}
                onClick={() => handleNotificationClick(n)}
              >
                <span className="font-medium text-apex-text">{n.title}</span>
                <span className="text-sm text-apex-text-muted/80">{n.body}</span>
                <span className="text-xs text-apex-text-muted/60">
                  {formatNotificationDate(n.created_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
