"use client";

import { useMutation } from "@apollo/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useT } from "@/lib/i18n";
import { type Envelope, type Role, type User } from "@/lib/types";
import { CREATE_USER_MUTATION, DELETE_USER_MUTATION, UPDATE_USER_MUTATION, USERS_QUERY } from "@/lib/user/queries";

/** `roles`: what the account may be switched to — staff roles only, on the Staff screen. */
type Props = { open: boolean; onOpenChange: (open: boolean) => void; user: User | null; roles: Role[]; onSaved: () => void };
type Form = { name: string; phone: string; email: string; password: string; role: Role; isActive: boolean };

const fromUser = (user: User | null): Form => ({
  name: user?.name ?? "",
  phone: user?.phone ?? "",
  email: user?.email ?? "",
  password: "",
  role: user?.role ?? "MANAGER",
  isActive: user?.isActive ?? true,
});

export function UserFormDialog({ open, onOpenChange, user, roles, onSaved }: Props) {
  const t = useT();
  const { user: me } = useCurrentUser();
  const [form, setForm] = useState<Form>(fromUser(user));
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (open) {
      setForm(fromUser(user));
      setConfirmDelete(false);
    }
  }, [open, user]);

  const options = { refetchQueries: [USERS_QUERY] };
  const [createUser, { loading: creating }] = useMutation(CREATE_USER_MUTATION, options);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER_MUTATION, options);
  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER_MUTATION, options);
  const busy = creating || updating || deleting;
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  // the back-end message is already localized — just show it
  const finish = (res?: Envelope | null) => {
    if (!res?.success) {
      toast.error(res?.message || t("common.error"));
      return;
    }
    toast.success(res.message);
    onSaved();
    onOpenChange(false);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (user) {
        const { data } = await updateUser({
          variables: { id: user.id, name: form.name, phone: form.phone, email: form.email, password: form.password || null, role: form.role, isActive: form.isActive },
        });
        finish(data?.updateUser);
      } else {
        const { data } = await createUser({ variables: { name: form.name, phone: form.phone, email: form.email || null, password: form.password, role: form.role } });
        finish(data?.createUser);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  };

  const remove = async () => {
    if (!user) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      const { data } = await deleteUser({ variables: { id: user.id } });
      finish(data?.deleteUser);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  };

  const isSuper = me?.role === "SUPER_ADMIN";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{user ? t("usersPage.form.editTitle") : t("usersPage.form.createTitle")}</DialogTitle>
            <DialogDescription>{user ? user.phone || user.email : t("usersPage.form.hint")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="user-name">{t("usersPage.form.name")}</Label>
            <Input id="user-name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-phone">{t("usersPage.form.phone")}</Label>
            <Input id="user-phone" type="tel" inputMode="numeric" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-email">{t("usersPage.form.email")}</Label>
            <Input id="user-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-password">{t("usersPage.form.password")}</Label>
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={user ? t("usersPage.form.passwordKeep") : ""}
              required={!user}
              minLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="user-role">{t("usersPage.form.role")}</Label>
            <Select id="user-role" value={form.role} onChange={(e) => set("role", e.target.value as Role)} disabled={!isSuper && user?.role === "SUPER_ADMIN"}>
              {roles.map((role) => (
                <option key={role} value={role} disabled={role === "SUPER_ADMIN" && !isSuper}>
                  {t(`roles.${role}`)}
                </option>
              ))}
            </Select>
          </div>
          {user && (
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" className="size-4 accent-copper" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
              {t("usersPage.form.active")}
            </label>
          )}

          <DialogFooter className="pt-2 sm:justify-between">
            {user && user.id !== me?.id ? (
              <Button type="button" variant={confirmDelete ? "destructive" : "ghost"} onClick={remove} disabled={busy}>
                {confirmDelete ? t("common.confirmDelete") : t("common.delete")}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {t("common.save")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
