"use client";

import { useApolloClient, useQuery } from "@apollo/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageToggle } from "@/components/app/language-toggle";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useT } from "@/lib/i18n";
import { ADMIN_COUNTS_QUERY, PARTNER_COUNTS_QUERY } from "@/lib/operator/queries";
import { initials } from "@/lib/utils";
import { ADMIN_NAV, PARTNER_NAV } from "./nav-items";

/** Days until July, when Naadam weeks sell out: the partner sidebar's standing reminder. */
const daysToPeak = () => {
  const now = new Date();
  const peak = new Date(Date.UTC(now.getUTCMonth() >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(), 6, 1));
  return Math.ceil((peak.getTime() - now.getTime()) / 86400000);
};

/** The dark back-office column (wireframes 2a, 3a). Hidden in print. */
export function Sidebar({ area }: { area: "partner" | "admin" }) {
  const t = useT();
  const pathname = usePathname();
  const client = useApolloClient();
  const { user } = useCurrentUser();
  const partner = area === "partner";
  const { data } = useQuery(partner ? PARTNER_COUNTS_QUERY : ADMIN_COUNTS_QUERY, { fetchPolicy: "cache-and-network", pollInterval: 60000 });
  const counts = {
    plans: partner ? data?.partnerPlans?.count : data?.marketplaceStats?.stats?.pendingPlans,
    orders: data?.orders?.tabs?.ACTION,
  };
  const operator = user?.operator;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await client.clearStore();
    window.location.assign("/");
  };

  return (
    <aside className="side no-print">
      <Link href="/" className="side-brand">
        itours<span>.</span>
        {t(partner ? "partner.brand" : "admin.brand")}
      </Link>
      {partner && operator && (
        <div className="side-co">
          <div className="avatar" style={{ width: 28, height: 28, background: operator.color, fontSize: 10 }}>
            {initials(operator.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--color-bg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {operator.name}
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(247, 244, 239,.5)" }}>
              {operator.isVerified ? t("partner.verified") : t("partner.awaiting")} · {t("partner.score")} {data?.myOperator?.operator?.stats?.score ?? "–"}
            </div>
          </div>
        </div>
      )}
      <nav>
        {(partner ? PARTNER_NAV : ADMIN_NAV).map(({ key, icon: Icon, href, exact, count }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          const n = count ? counts[count] : undefined;
          return (
            <Link key={key} href={href} aria-current={active ? "page" : undefined}>
              <Icon size={16} />
              {t(key)}
              {n != null && n > 0 && <span className={count === "plans" && partner ? "count" : "badge"}>{n}</span>}
            </Link>
          );
        })}
        <div style={{ height: 1, background: "rgba(247, 244, 239,.14)", margin: "10px 8px" }} />
        {partner && operator && <a href={`/operators/${operator.slug}`}>{t("nav.publicPage")}</a>}
        {!partner && <Link href="/">{t("nav.marketplace")}</Link>}
        <button type="button" onClick={logout} style={{ width: "100%" }}>
          {t("common.logout")}
        </button>
      </nav>
      <div style={{ margin: "16px 8px" }}>
        <LanguageToggle />
      </div>
      {partner && (
        <div className="side-tip">
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-bg)", marginBottom: 5 }}>{t("partner.peakIn", { n: daysToPeak() })}</div>
          <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "rgba(247, 244, 239,.6)" }}>{t("partner.peakTip")}</div>
        </div>
      )}
    </aside>
  );
}
