import type { Metadata } from "next";
import { print } from "graphql";
import { OperatorsView } from "@/components/app/operators/operators-view";
import { serverQuery } from "@/lib/api";
import { OPERATORS_QUERY } from "@/lib/operator/queries";
import { requestContext } from "@/lib/server";
import type { Operator } from "@/lib/types";

export const metadata: Metadata = { title: "Operators" };

export default async function OperatorsPage() {
  const { locale } = await requestContext();
  const data = await serverQuery<{ operators: { operators: Operator[] } | null }>(print(OPERATORS_QUERY), {}, { locale });
  return <OperatorsView operators={data?.operators?.operators ?? []} />;
}
