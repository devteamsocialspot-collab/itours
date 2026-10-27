"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SiteHeader } from "@/components/app/site-header";
import { getActiveLocale, useT } from "@/lib/i18n";
import { homeFor } from "@/lib/types";

type Mode = "login" | "register";

// only same-origin paths — never bounce to another host
const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : null);

const DEMO = [
  ["elena@itours.mn", "auth.demoTraveller"],
  ["bat@nomadica.mn", "auth.demoOperator"],
  ["admin@itours.mn", "auth.demoAdmin"],
] as const;

function AuthForm({ mode }: { mode: Mode }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const register = mode === "register";
  const agency = register && params.get("type") === "agency";
  const [form, setForm] = useState({ name: "", login: "", password: "", country: "", companyName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: event.target.value }));
  // the other form keeps ?next= so the detour still ends where the visitor was headed
  const next = params.get("next");
  const keep = next ? `?next=${encodeURIComponent(next)}` : "";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = register ? { ...form, companyName: agency ? form.companyName : "", country: agency ? "" : form.country } : { login: form.login, password: form.password };
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-locale": getActiveLocale() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) return setError(data.message || t("auth.failed"));
      // a full load: the server pages and the Apollo cache start over as the signed-in user
      window.location.assign(safeNext(next) ?? homeFor(data.user?.role) ?? "/");
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <h2>{register ? t("auth.registerTitle") : t("auth.title")}</h2>
      <p className="small muted">{register ? t("auth.registerSubtitle") : t("auth.subtitle")}</p>
      {register && (
        <div className="seg" style={{ marginBottom: 14 }}>
          <button type="button" className={`seg-opt ${!agency ? "on" : ""}`} onClick={() => router.replace(`/register${keep}`)}>
            {t("auth.traveller")}
          </button>
          <button type="button" className={`seg-opt ${agency ? "on" : ""}`} onClick={() => router.replace(`/register?type=agency${next ? `&next=${encodeURIComponent(next)}` : ""}`)}>
            {t("auth.travelAgency")}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="form panel" style={{ borderRadius: 28, padding: 22 }}>
        {agency && (
          <div className="field">
            <label htmlFor="company">{t("auth.companyName")}</label>
            <input id="company" className="input" value={form.companyName} onChange={set("companyName")} required minLength={2} />
          </div>
        )}
        {register && (
          <div className="field">
            <label htmlFor="name">{t("auth.name")}</label>
            <input id="name" className="input" autoComplete="name" value={form.name} onChange={set("name")} required minLength={2} />
          </div>
        )}
        <div className="field">
          <label htmlFor="login">{t("auth.login")}</label>
          <input id="login" className="input" autoComplete="username" placeholder={t("auth.loginPh")} value={form.login} onChange={set("login")} required />
        </div>
        {register && !agency && (
          <div className="field">
            <label htmlFor="country">{t("auth.country")}</label>
            <input id="country" className="input" autoComplete="country-name" value={form.country} onChange={set("country")} />
          </div>
        )}
        <div className="field">
          <label htmlFor="password">{t("auth.password")}</label>
          <input
            id="password"
            type="password"
            className="input"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={register ? 6 : undefined}
            value={form.password}
            onChange={set("password")}
            required
          />
        </div>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {register ? (loading ? t("auth.registering") : t("auth.registerSubmit")) : loading ? t("auth.submitting") : t("auth.submit")}
        </button>
      </form>
      {agency && <p className="xs muted" style={{ marginTop: 10 }}>{t("auth.agencyHint")}</p>}
      <p className="small muted" style={{ marginTop: 14 }}>
        {register ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
        <Link href={`/${register ? "login" : "register"}${keep}`}>{register ? t("auth.toLogin") : t("auth.toRegister")}</Link>
      </p>
      {!register && (
        <div className="panel-sand small" style={{ marginTop: 18 }}>
          <div className="bold" style={{ marginBottom: 6 }}>
            {t("auth.demoAccounts")}
          </div>
          {DEMO.map(([login, role]) => (
            <div key={login}>
              <code>{login}</code> — {t(role)}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

/** Sign-in and sign-up share one card; the login field takes a phone number or an email. */
export function AuthCard({ mode }: { mode: Mode }) {
  return (
    <>
      <SiteHeader />
      {/* useSearchParams needs a Suspense boundary (Next 15) */}
      <Suspense fallback={null}>
        <AuthForm mode={mode} />
      </Suspense>
    </>
  );
}
