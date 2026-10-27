"use client";

import { useMutation } from "@apollo/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { ordersCsvUrl } from "@/lib/api";
import { readSessionToken } from "@/lib/auth";
import { CANCEL_ORDER_MUTATION, CONFIRM_ORDER_MUTATION, MARK_PAID_MUTATION, ORDERS_QUERY } from "@/lib/booking/queries";
import { PARTNER_COUNTS_QUERY } from "@/lib/operator/queries";
import { useReport } from "@/lib/hooks/use-report";
import { getActiveLocale, useLocale, useT } from "@/lib/i18n";
import type { Booking, OrderTab } from "@/lib/types";
import { day, dayRange, initials, mnt, usd } from "@/lib/utils";

const TABS: OrderTab[] = ["ACTION", "CONFIRMED", "TRAVELLING", "COMPLETED", "CANCELLED"];

export const PAGE_SIZE = 20;
/** The inbox's orderings, as the API's orderBy / direction; newest booking first by default. */
export const ORDER_SORTS = {
  newest: { orderBy: "createdAt", direction: "DESC" },
  oldest: { orderBy: "createdAt", direction: "ASC" },
  soonest: { orderBy: "startDate", direction: "ASC" },
  latest: { orderBy: "startDate", direction: "DESC" },
} as const;
export type OrderSort = keyof typeof ORDER_SORTS;

type Props = {
  orders: Booking[];
  tabs: Record<OrderTab, number> | null;
  tab: OrderTab;
  onTab: (tab: OrderTab) => void;
  search: string;
  onSearch: (value: string) => void;
  sort: OrderSort;
  onSort: (sort: OrderSort) => void;
  /** 0-based; `count` is the whole tab's, across pages. */
  page: number;
  count: number;
  onPage: (page: number) => void;
  loading: boolean;
  error?: string;
  refetch: () => void;
};

/** "21–40 of 57", then ‹ 1 … 3 4 5 … 9 ›: the first and last page and the ones around this one. */
function Pager({ page, count, onPage }: Pick<Props, "page" | "count" | "onPage">) {
  const t = useT();
  if (count === 0) return null;
  const pages = Math.ceil(count / PAGE_SIZE);
  const shown = Array.from({ length: pages }, (_, n) => n).filter((n) => n === 0 || n === pages - 1 || Math.abs(n - page) <= 1);
  return (
    <div className="row" style={{ justifyContent: "space-between", marginTop: 14, flexWrap: "wrap" }}>
      <span className="small muted">{t("common.shown", { from: page * PAGE_SIZE + 1, to: Math.min(count, (page + 1) * PAGE_SIZE), n: count })}</span>
      {pages > 1 && (
        <nav className="row" style={{ gap: 4 }} aria-label={t("common.pages")}>
          <button type="button" className="btn btn-secondary btn-icon" disabled={page === 0} aria-label={t("common.prev")} onClick={() => onPage(page - 1)}>
            <ChevronLeft size={16} />
          </button>
          {shown.map((n, i) => (
            <Fragment key={n}>
              {i > 0 && n - shown[i - 1] > 1 && <span className="muted">…</span>}
              <button
                type="button"
                className={`btn btn-sm ${n === page ? "btn-primary" : "btn-ghost"}`}
                style={{ minWidth: 36, height: 36 }}
                aria-current={n === page ? "page" : undefined}
                onClick={() => onPage(n)}
              >
                {n + 1}
              </button>
            </Fragment>
          ))}
          <button type="button" className="btn btn-secondary btn-icon" disabled={page >= pages - 1} aria-label={t("common.next")} onClick={() => onPage(page + 1)}>
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}

/** The orders inbox (wireframe 2d): tabs by what needs doing, a sortable, paged table, and the selected order's actions. */
export function OrdersView({ orders, tabs, tab, onTab, search, onSearch, sort, onSort, page, count, onPage, loading, error, refetch }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sel = orders.find((o) => o.id === selectedId) ?? orders[0];
  const [guide, setGuide] = useState("");
  const [driver, setDriver] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  useEffect(() => {
    setGuide(sel?.guide ?? "");
    setDriver(sel?.driver ?? "");
    setConfirmCancel(false);
  }, [sel?.id, sel?.guide, sel?.driver]);

  const options = { refetchQueries: [ORDERS_QUERY, PARTNER_COUNTS_QUERY] };
  const [confirm, { loading: confirming }] = useMutation(CONFIRM_ORDER_MUTATION, options);
  const [markPaid, { loading: marking }] = useMutation(MARK_PAID_MUTATION, options);
  const [cancel, { loading: cancelling }] = useMutation(CANCEL_ORDER_MUTATION, options);
  const report = useReport(refetch);
  const busy = confirming || marking || cancelling;

  const ago = (iso: string) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    return m < 60 ? t("orders.minAgo", { n: m }) : m < 1440 ? t("orders.hAgo", { n: Math.round(m / 60) }) : t("orders.dAgo", { n: Math.round(m / 1440) });
  };
  const statusTag = (o: Booking) =>
    o.stage === "PAID" ? (
      <span className="tag tag-solid">{t("orders.paidAssign")}</span>
    ) : o.stage === "PENDING_PAYMENT" ? (
      <span className="tag tag-accent">{t("orders.transferPending")}</span>
    ) : o.stage === "CANCELLED" ? (
      <span className="tag tag-neutral">
        {t("orders.cancelledBy")}
        {o.cancelledBy ? ` · ${t(`roles.${o.cancelledBy}`)}` : ""}
      </span>
    ) : (
      <span className="tag tag-accent-2">{o.guide || t(`trips.stage.${o.stage}`)}</span>
    );

  /** The CSV carries the bearer token, so it is fetched here and handed to the browser as a file. */
  const exportCsv = async () => {
    const token = readSessionToken();
    const res = await fetch(ordersCsvUrl, { headers: { "x-locale": getActiveLocale(), ...(token ? { authorization: `Bearer ${token}` } : {}) } });
    if (!res.ok) return toast.error(t("common.error"));
    const href = URL.createObjectURL(await res.blob());
    const link = Object.assign(document.createElement("a"), { href, download: `itours-orders-${new Date().toISOString().slice(0, 10)}.csv` });
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div style={{ margin: "-22px -28px 0" }}>
      <div className="topbar-dark" style={{ flexWrap: "wrap" }}>
        <Link href="/partner">← {t("nav.overview")}</Link>
        <div className="heading" style={{ fontSize: 17, color: "var(--color-bg)" }}>
          {t("orders.title")}
        </div>
        <div className="row ml-auto">
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="input"
            placeholder={t("orders.search")}
            style={{ width: 240, background: "rgba(247, 244, 239,.1)", borderColor: "rgba(247, 244, 239,.25)", color: "var(--color-bg)" }}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportCsv}>
            {t("orders.exportCsv")}
          </button>
        </div>
      </div>

      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 400px", alignItems: "start" }}>
        <div style={{ padding: "18px 22px 28px 28px", minWidth: 0 }}>
          <div className="row" style={{ marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div className="wrap-row">
              {TABS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`tag ${key === tab ? "tag-solid" : "tag-neutral"}`}
                  style={{ padding: "6px 14px", fontSize: 13, border: 0, cursor: "pointer" }}
                  onClick={() => {
                    onTab(key);
                    setSelectedId(null);
                  }}
                >
                  {t(`orders.tab.${key}`)} · {tabs?.[key] ?? 0}
                </button>
              ))}
            </div>
            <label className="row small ml-auto" style={{ gap: 8 }}>
              <span className="muted">{t("orders.sort")}</span>
              <select
                className="input"
                value={sort}
                onChange={(e) => {
                  onSort(e.target.value as OrderSort);
                  setSelectedId(null);
                }}
                style={{ width: "auto", minHeight: 32, fontSize: 13 }}
              >
                {(Object.keys(ORDER_SORTS) as OrderSort[]).map((key) => (
                  <option key={key} value={key}>
                    {t(`orders.sorts.${key}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          <table className="table">
            <thead>
              <tr>
                <th>{t("orders.traveller")}</th>
                <th>{t("orders.planDeparture")}</th>
                <th>{t("orders.pax")}</th>
                <th>{t("orders.value")}</th>
                <th>{t("orders.status")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    {loading ? t("common.loading") : t("common.nothing")}
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className={o.id === sel?.id ? "sel" : ""} onClick={() => setSelectedId(o.id)} style={{ cursor: "pointer" }}>
                  <td>
                    <div className="bold">{o.traveller?.name}</div>
                    <div className="xs muted">
                      {o.code} · {o.traveller?.country || "—"} · {ago(o.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div>{o.plan.titleEn.split(":")[0]}</div>
                    <div className="xs muted">{day(o.departure.startDate, locale)}</div>
                  </td>
                  <td>{o.pax}</td>
                  <td className="nowrap">{o.method === "CARD" ? usd(o.totalUsd) : mnt(o.totalUsd)}</td>
                  <td>{statusTag(o)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager
            page={page}
            count={count}
            onPage={(next) => {
              onPage(next);
              setSelectedId(null);
            }}
          />
        </div>

        {sel && (
          <div style={{ padding: "18px 28px 28px 6px" }}>
            <div className="panel" style={{ borderRadius: 28, padding: 20, boxShadow: "var(--shadow-md)" }}>
              <div className="row" style={{ alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <div className="avatar" style={{ width: 42, height: 42, background: "var(--color-neutral-400)" }}>
                  {initials(sel.traveller?.name ?? "")}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="heading" style={{ fontSize: 17 }}>
                    {sel.traveller?.name}
                  </div>
                  <div className="small" style={{ color: "var(--ink-60)" }}>
                    {[sel.code, ago(sel.createdAt), sel.traveller?.email || sel.traveller?.phone].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {(sel.status === "PAID" || sel.status === "CONFIRMED") && <span className="tag tag-sage ml-auto">{t("orders.escrowHeld")}</span>}
              </div>
              <div className="sum-lines" style={{ lineHeight: 2, paddingBottom: 14, borderBottom: "1px solid var(--color-divider)" }}>
                <div>
                  <span className="muted">{t("orders.plan")}</span>
                  <span className="semi right">{sel.plan.titleEn.split(":")[0]}</span>
                </div>
                <div>
                  <span className="muted">{t("orders.departure")}</span>
                  <span className="semi">{dayRange(sel.departure.startDate, sel.plan.days, locale)}</span>
                </div>
                <div>
                  <span className="muted">{t("orders.travellers")}</span>
                  <span className="semi">
                    {sel.pax} · {t(`plan.${sel.room}`)}
                  </span>
                </div>
                <div>
                  <span className="muted">{sel.status === "PENDING_PAYMENT" ? t("orders.due") : t("orders.paid")}</span>
                  <span className="semi">
                    {usd(sel.totalUsd)} · {sel.method.toLowerCase()}
                  </span>
                </div>
                <div>
                  <span className="muted">{t("orders.payout")}</span>
                  <span className="semi">
                    {usd(sel.payoutUsd)} · {day(sel.payoutDate, locale)}
                  </span>
                </div>
              </div>
              {sel.notes && (
                <div style={{ padding: "14px 0", borderBottom: "1px solid var(--color-divider)" }}>
                  <div className="kicker">{t("orders.notes")}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-80)" }}>{sel.notes}</div>
                </div>
              )}

              {sel.status === "PENDING_PAYMENT" && (
                <div style={{ paddingTop: 14 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={busy}
                    onClick={async () => {
                      const { data } = await markPaid({ variables: { id: sel.id } });
                      await report(data?.markOrderPaid);
                    }}
                  >
                    {t("orders.transferReceived")}
                  </button>
                </div>
              )}
              {(sel.status === "PAID" || sel.status === "CONFIRMED") && (
                <form
                  style={{ paddingTop: 14 }}
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const { data } = await confirm({ variables: { id: sel.id, guide, driver } });
                    await report(data?.confirmOrder);
                  }}
                >
                  <div className="kicker">{t("orders.assign")}</div>
                  <div className="col" style={{ gap: 9, marginBottom: 10 }}>
                    <div className="field">
                      <label>{t("orders.guide")}</label>
                      <input className="input" value={guide} onChange={(e) => setGuide(e.target.value)} placeholder="Bat-Erdene T. (EN, DE)" required />
                    </div>
                    <div className="field">
                      <label>{t("orders.driver")}</label>
                      <input className="input" value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="Ganbold S. · UAZ 452 #3" />
                    </div>
                  </div>
                  {sel.status === "PAID" ? (
                    <button className="btn btn-primary btn-block" disabled={busy} style={{ fontSize: 14, paddingBlock: 10 }}>
                      {t("orders.confirmSend")}
                    </button>
                  ) : (
                    <>
                      <p className="ok-msg" style={{ margin: 0 }}>
                        ✓ {t("orders.confirmed")} — {sel.guide}
                        {sel.driver && `, ${sel.driver}`}
                      </p>
                      {(guide !== sel.guide || driver !== sel.driver) && (
                        <button className="btn btn-secondary btn-block btn-sm" disabled={busy}>
                          {t("common.save")}
                        </button>
                      )}
                    </>
                  )}
                </form>
              )}
              {sel.traveller?.email && (
                <a
                  href={`mailto:${sel.traveller.email}?subject=${encodeURIComponent(`${sel.code} — ${sel.plan.titleEn}`)}`}
                  className="btn btn-secondary btn-block btn-sm"
                >
                  {t("orders.email", { name: (sel.traveller.name ?? "").split(" ")[0] })}
                </a>
              )}
              {sel.canCancel && (
                <button
                  type="button"
                  className="btn btn-ghost btn-block btn-xs"
                  disabled={busy}
                  onClick={async () => {
                    if (!confirmCancel) return setConfirmCancel(true);
                    const { data } = await cancel({ variables: { id: sel.id } });
                    await report(data?.cancelOrder);
                  }}
                >
                  {confirmCancel ? t("common.confirmDelete") : t("orders.cancel")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
