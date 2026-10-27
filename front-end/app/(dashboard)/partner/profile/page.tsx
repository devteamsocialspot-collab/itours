"use client";

import { useQuery } from "@apollo/client";
import { ProfileForm } from "@/components/app/partner/profile-form";
import { useT } from "@/lib/i18n";
import { MY_OPERATOR_QUERY } from "@/lib/operator/queries";

export default function ProfilePage() {
  const t = useT();
  const { data, loading } = useQuery(MY_OPERATOR_QUERY, { fetchPolicy: "cache-and-network" });
  const operator = data?.myOperator?.operator;
  if (!operator) return <p className="muted">{loading ? t("common.loading") : data?.myOperator?.message}</p>;
  return <ProfileForm key={operator.id} operator={operator} />;
}
