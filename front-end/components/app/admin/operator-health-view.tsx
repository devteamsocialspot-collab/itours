"use client";

import { useMutation } from "@apollo/client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { OperatorFormDialog } from "@/components/app/admin/operator-form-dialog";
import { useReport } from "@/lib/hooks/use-report";
import { useT } from "@/lib/i18n";
import { ADMIN_COUNTS_QUERY, SET_VERIFIED_MUTATION } from "@/lib/operator/queries";
import type { Operator } from "@/lib/types";

/** Every agency, verified or not, with the flag staff should act on and the licence switch (wireframe 3a); agencies can be added by hand. */
export function OperatorHealthView({ operators, loading, refetch }: { operators: Operator[]; loading: boolean; refetch: () => void }) {
  const t = useT();
  const [setVerified, { loading: saving }] = useMutation(SET_VERIFIED_MUTATION, { refetchQueries: [ADMIN_COUNTS_QUERY] });
  const report = useReport(refetch);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap" }}>
        <h4 style={{ margin: 0 }}>{t("admin.healthTitle")}</h4>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
          <Plus size={15} />
          {t("admin.addOperator")}
        </button>
      </div>
      <OperatorFormDialog open={adding} onOpenChange={setAdding} onSaved={refetch} />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t("admin.operator")}</th>
              <th>{t("admin.plans")}</th>
              <th>{t("admin.score")}</th>
              <th>{t("admin.cancelRate")}</th>
              <th>{t("admin.reply")}</th>
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            {operators.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  {loading ? t("common.loading") : t("common.nothing")}
                </td>
              </tr>
            )}
            {operators.map((operator) => {
              const healthy = operator.health === "HEALTHY";
              return (
                <tr key={operator.id}>
                  <td>
                    {operator.isVerified ? (
                      <Link href={`/operators/${operator.slug}`} className="plain">
                        {operator.name}
                      </Link>
                    ) : (
                      operator.name
                    )}
                    <div className="xs muted">{operator.licenceNo}</div>
                  </td>
                  <td>{operator.stats?.plansLive ?? 0}</td>
                  <td>
                    <span className={`tag ${(operator.stats?.score ?? 0) >= 80 ? "tag-accent-2" : "tag-accent"}`}>{operator.stats?.score ?? "–"}</span>
                  </td>
                  <td>{(operator.stats?.cancelRate ?? 0).toFixed(1)}%</td>
                  <td>{operator.replyHours} h</td>
                  <td>
                    <span className="small" style={{ color: healthy ? "var(--ink-55)" : "var(--color-accent-800)" }}>
                      {t(`admin.health.${operator.health ?? "HEALTHY"}`)}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={saving}
                      className={`btn btn-xs ${operator.isVerified ? "btn-ghost" : "btn-primary"}`}
                      onClick={async () => {
                        const { data } = await setVerified({ variables: { id: operator.id, isVerified: !operator.isVerified } });
                        await report(data?.setOperatorVerified);
                      }}
                    >
                      {operator.isVerified ? t("admin.unverify") : t("admin.verify")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
