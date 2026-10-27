"use client";

import { useMutation } from "@apollo/client";
import { useState } from "react";
import { useReport } from "@/lib/hooks/use-report";
import { useT } from "@/lib/i18n";
import { UPDATE_MY_OPERATOR_MUTATION } from "@/lib/operator/queries";
import { CURRENT_USER_QUERY } from "@/lib/user/queries";
import type { Operator } from "@/lib/types";

/** What the agency says about itself on its public page (wireframe 2e). Verification and reply time are staff's. */
export function ProfileForm({ operator }: { operator: Operator }) {
  const t = useT();
  const [form, setForm] = useState({
    name: operator.name,
    licenceNo: operator.licenceNo,
    foundedYear: operator.foundedYear ? String(operator.foundedYear) : "",
    city: operator.city,
    languages: operator.languages.join(", "),
    about: operator.about,
    fleet: operator.fleet,
    coverUrl: operator.coverUrl,
  });
  const [save, { loading }] = useMutation(UPDATE_MY_OPERATOR_MUTATION, { refetchQueries: [CURRENT_USER_QUERY] });
  const report = useReport();
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: event.target.value }));

  return (
    <div style={{ maxWidth: 720 }}>
      <h2>{t("profile.title")}</h2>
      <form
        className="panel grid-2"
        style={{ gap: 14 }}
        onSubmit={async (event) => {
          event.preventDefault();
          const { data } = await save({
            variables: {
              ...form,
              foundedYear: form.foundedYear ? Number(form.foundedYear) : null,
              languages: form.languages
                .split(",")
                .map((language) => language.trim())
                .filter(Boolean),
            },
          });
          await report(data?.updateMyOperator);
        }}
      >
        <div className="field" style={{ gridColumn: "span 2" }}>
          <label>{t("profile.name")}</label>
          <input className="input" value={form.name} onChange={set("name")} required />
        </div>
        <div className="field">
          <label>{t("profile.licence")}</label>
          <input className="input" value={form.licenceNo} onChange={set("licenceNo")} />
        </div>
        <div className="field">
          <label>{t("profile.founded")}</label>
          <input className="input" type="number" value={form.foundedYear} onChange={set("foundedYear")} />
        </div>
        <div className="field">
          <label>{t("profile.city")}</label>
          <input className="input" value={form.city} onChange={set("city")} />
        </div>
        <div className="field">
          <label>{t("profile.languages")}</label>
          <input className="input" value={form.languages} onChange={set("languages")} />
        </div>
        <div className="field" style={{ gridColumn: "span 2" }}>
          <label>{t("profile.about")}</label>
          <textarea className="input" style={{ borderRadius: 18, minHeight: 110 }} value={form.about} onChange={set("about")} />
        </div>
        <div className="field" style={{ gridColumn: "span 2" }}>
          <label>{t("profile.fleet")}</label>
          <textarea className="input" style={{ borderRadius: 18 }} value={form.fleet} onChange={set("fleet")} />
        </div>
        <div className="field" style={{ gridColumn: "span 2" }}>
          <label>{t("profile.cover")}</label>
          <input className="input" type="url" value={form.coverUrl} onChange={set("coverUrl")} placeholder="https://…" />
        </div>
        <button className="btn btn-primary" disabled={loading} style={{ justifySelf: "start" }}>
          {t("profile.save")}
        </button>
      </form>
    </div>
  );
}
