"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AccountMenu } from "@/components/app/account-menu";
import { Brand } from "@/components/app/brand";
import { LanguageToggle } from "@/components/app/language-toggle";
import { useT } from "@/lib/i18n";

/** The traveller pages' links, the current section marked; on a phone they fold into the menu button. */
function NavLinks() {
  const t = useT();
  const path = usePathname();
  const current = (href: string) => (href === "/" ? path === "/" : path.startsWith(href)) || undefined;
  return (
    <>
      <Link href="/" aria-current={current("/") && "page"}>
        {t("nav.discover")}
      </Link>
      <Link href="/search" aria-current={current("/search") && "page"}>
        {t("nav.search")}
      </Link>
      <Link href="/operators" aria-current={current("/operators") && "page"}>
        {t("nav.operators")}
      </Link>
      <Link href="/#how">{t("nav.howItWorks")}</Link>
    </>
  );
}

/** A <details> menu: no state, and it closes once a link is picked. */
function MobileMenu() {
  const t = useT();
  return (
    <details className="menu show-m">
      <summary className="btn btn-icon" aria-label={t("nav.menu")}>
        <Menu size={20} />
      </summary>
      <nav className="menu-pop" onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}>
        <NavLinks />
      </nav>
    </details>
  );
}

/**
 * One bar on every traveller page, on the page's grid; checkout keeps its own. "home" floats it over the
 * landing's hero until the page scrolls. `children` sit after the brand, `actions` just before the account menu.
 */
export function SiteHeader({ variant = "bar", children, actions }: { variant?: "home" | "bar"; children?: ReactNode; actions?: ReactNode }) {
  const home = variant === "home";
  return (
    <header className={home ? "site-bar floating" : "site-bar"}>
      <div className="wrap">
        <div className="row" style={{ marginRight: "auto", gap: 14 }}>
          <Brand large />
          {children}
        </div>
        <nav className="site-links hide-m">
          <NavLinks />
        </nav>
        <div className="row" style={{ marginLeft: 18 }}>
          {actions}
          <AccountMenu />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const t = useT();
  return (
    <footer className="site">
      <div className="wrap footer-in">
        <div className="col" style={{ gap: 12, alignItems: "flex-start" }}>
          <Brand large />
          <p style={{ margin: 0, maxWidth: "26em" }}>{t("home.footerTagline")}</p>
          <LanguageToggle />
        </div>
        <nav aria-label={t("home.footerExplore")}>
          <div className="kicker">{t("home.footerExplore")}</div>
          <NavLinks />
        </nav>
        <nav aria-label={t("home.footerAgencies")}>
          <div className="kicker">{t("home.footerAgencies")}</div>
          <Link href="/register?type=agency">{t("home.ctaAgency")}</Link>
          <Link href="/login">{t("nav.signIn")}</Link>
        </nav>
      </div>
      <div className="wrap footer-note">{t("home.footerNote")}</div>
    </footer>
  );
}
