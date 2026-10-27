"use client";

import { useMutation } from "@apollo/client";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";
import { CREATE_OPERATOR_MUTATION } from "@/lib/operator/queries";

type Form = {
  name: string;
  licenceNo: string;
  city: string;
  foundedYear: string;
  languages: string;
  contactName: string;
  login: string;
  password: string;
  isVerified: boolean;
};
const EMPTY: Form = { name: "", licenceNo: "", city: "", foundedYear: "", languages: "", contactName: "", login: "", password: "", isVerified: false };

// no look-alikes (0/O, 1/l/I): the password gets read out or copied from a message
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newPassword = () => Array.from(crypto.getRandomValues(new Uint32Array(10)), (n) => ALPHABET[n % ALPHABET.length]).join("");

const Field = ({ id, label, children }: { id: string; label: string; children: ReactNode }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);

/**
 * Staff add an agency that doesn't sign up itself: the company and its first login. Once saved, the
 * dialog shows the sign-in details to hand over — the password can't be looked up again.
 */
export function OperatorFormDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }) {
  const t = useT();
  const [form, setForm] = useState<Form>(EMPTY);
  const [added, setAdded] = useState<{ name: string; isVerified: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, password: newPassword() });
      setAdded(null);
      setCopied(false);
    }
  }, [open]);
  const [createOperator, { loading }] = useMutation(CREATE_OPERATOR_MUTATION);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const f = (key: string) => t(`admin.operatorForm.${key}`);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data } = await createOperator({
        variables: {
          name: form.name,
          contactName: form.contactName,
          login: form.login,
          password: form.password,
          isVerified: form.isVerified,
          // left empty, the API's defaults apply (Ulaanbaatar, Mongolian)
          licenceNo: form.licenceNo.trim() || undefined,
          city: form.city.trim() || undefined,
          foundedYear: Number(form.foundedYear) || undefined,
          languages: form.languages
            .split(",")
            .map((language) => language.trim())
            .filter(Boolean),
        },
      });
      const res = data?.createOperator;
      if (!res?.success) {
        toast.error(res?.message || t("common.error"));
        return;
      }
      toast.success(res.message);
      setAdded({ name: res.operator.name, isVerified: res.operator.isVerified });
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  };

  const signIn = typeof window === "undefined" ? "/login" : `${window.location.origin}/login`;
  const copy = async () => {
    await navigator.clipboard.writeText(`${signIn}\n${f("login")}: ${form.login}\n${f("password")}: ${form.password}`);
    setCopied(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        {added ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t("admin.operatorForm.readyTitle", { name: added.name })}</DialogTitle>
              <DialogDescription>{t("admin.operatorForm.readyText", { url: signIn })}</DialogDescription>
            </DialogHeader>
            <div className="panel-sm" style={{ fontSize: 14, lineHeight: 1.9 }}>
              <div>
                {f("login")}: <b>{form.login}</b>
              </div>
              <div>
                {f("password")}: <b style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em" }}>{form.password}</b>
              </div>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {added.isVerified ? f("readyVerified") : f("readyUnverified")}
            </p>
            <DialogFooter>
              <Button variant="secondary" onClick={copy}>
                {copied ? <Check /> : <Copy />}
                {copied ? f("copied") : f("copy")}
              </Button>
              <Button onClick={() => onOpenChange(false)}>{t("common.done")}</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" autoComplete="off">
            <DialogHeader>
              <DialogTitle>{f("title")}</DialogTitle>
              <DialogDescription>{f("hint")}</DialogDescription>
            </DialogHeader>

            <div className="kicker" style={{ margin: "4px 0 0" }}>
              {f("company")}
            </div>
            <Field id="op-name" label={f("companyName")}>
              <Input id="op-name" value={form.name} onChange={(e) => set("name", e.target.value)} required minLength={2} />
            </Field>
            {/* items-end: a label that wraps (Mongolian runs longer) doesn't push its field out of line */}
            <div className="grid grid-cols-2 items-end gap-3">
              <Field id="op-licence" label={f("licenceNo")}>
                <Input id="op-licence" value={form.licenceNo} onChange={(e) => set("licenceNo", e.target.value)} />
              </Field>
              <Field id="op-founded" label={f("foundedYear")}>
                <Input id="op-founded" type="number" min={1950} max={2100} value={form.foundedYear} onChange={(e) => set("foundedYear", e.target.value)} />
              </Field>
              <Field id="op-city" label={f("city")}>
                <Input id="op-city" value={form.city} placeholder="Ulaanbaatar" onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field id="op-languages" label={f("languages")}>
                <Input id="op-languages" value={form.languages} placeholder="Mongolian, English" onChange={(e) => set("languages", e.target.value)} />
              </Field>
            </div>

            <div className="kicker" style={{ margin: "8px 0 0" }}>
              {f("account")}
            </div>
            <Field id="op-contact" label={f("contactName")}>
              <Input id="op-contact" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} required minLength={2} />
            </Field>
            <Field id="op-login" label={f("login")}>
              <Input id="op-login" value={form.login} placeholder={f("loginPh")} onChange={(e) => set("login", e.target.value)} required autoComplete="off" />
            </Field>
            <Field id="op-password" label={f("password")}>
              <div className="flex gap-2">
                <Input
                  id="op-password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  minLength={6}
                  autoComplete="off"
                  spellCheck={false}
                  style={{ fontFamily: "ui-monospace, monospace" }}
                />
                <Button variant="secondary" className="h-11" onClick={() => set("password", newPassword())}>
                  <RefreshCw />
                  {f("generate")}
                </Button>
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" className="size-4 accent-copper" checked={form.isVerified} onChange={(e) => set("isVerified", e.target.checked)} />
              {f("verifyNow")}
            </label>

            <DialogFooter className="pt-2">
              <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {f("create")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
