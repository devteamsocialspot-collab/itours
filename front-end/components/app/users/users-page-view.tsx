"use client";

import { Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useT } from "@/lib/i18n";
import { STAFF_ROLES, type Role, type User } from "@/lib/types";
import { day } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { UserFormDialog } from "./user-form-dialog";

type Props = {
  users: User[];
  count: number;
  loading: boolean;
  error?: string;
  search: string;
  onSearch: (value: string) => void;
  role: Role | "";
  onRole: (role: Role | "") => void;
  refetch: () => void;
};

export function UsersPageView({ users, count, loading, error, search, onSearch, role, onRole, refetch }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (user: User) => {
    setEditing(user);
    setOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl leading-tight text-ink">{t("usersPage.title")}</h1>
          <p className="mt-1 text-xs text-ink-muted">{t("usersPage.subtitle", { count })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={t("usersPage.searchPlaceholder")}
              className="h-9 w-56 rounded-full border-sand-700 bg-sand-100 pl-10 pr-4 text-[13px] sm:w-64"
            />
          </div>
          <Select value={role} onChange={(e) => onRole(e.target.value as Role | "")} className="h-9 w-40 rounded-full border-sand-700 bg-sand-100 text-[13px]">
            <option value="">{t("usersPage.allRoles")}</option>
            {STAFF_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={openCreate}>
            <Plus />
            {t("usersPage.create")}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-t-0">
              <TableHead>{t("usersPage.columns.name")}</TableHead>
              <TableHead>{t("usersPage.columns.phone")}</TableHead>
              <TableHead>{t("usersPage.columns.email")}</TableHead>
              <TableHead>{t("usersPage.columns.role")}</TableHead>
              <TableHead>{t("usersPage.columns.status")}</TableHead>
              <TableHead>{t("usersPage.columns.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} onClick={() => openEdit(user)} className="cursor-pointer hover:bg-sand-200/60">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} className="size-8" />
                    <span className="font-semibold text-ink">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-ink-soft">{user.phone}</TableCell>
                <TableCell className="text-ink-soft">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "SUPER_ADMIN" ? "dark" : "default"}>{t(`roles.${user.role}`)}</Badge>
                </TableCell>
                <TableCell className={user.isActive ? "font-semibold text-sage-dark" : "font-semibold text-sand-900"}>
                  {user.isActive ? t("common.active") : t("common.inactive")}
                </TableCell>
                <TableCell className="text-ink-muted">{user.createdAt ? day(user.createdAt, locale) : ""}</TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-ink-muted">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      {t("common.loading")}
                    </span>
                  ) : (
                    t("usersPage.empty")
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <UserFormDialog open={open} onOpenChange={setOpen} user={editing} roles={STAFF_ROLES} onSaved={refetch} />
    </div>
  );
}
