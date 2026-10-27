"use client";

import { useApolloClient } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/app/language-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useT } from "@/lib/i18n";
import { STAFF_ROLES } from "@/lib/types";
import { initials } from "@/lib/utils";

/** The header's right side: language, then sign-in buttons or the signed-in user's menu. */
export function AccountMenu() {
  const t = useT();
  const router = useRouter();
  const client = useApolloClient();
  const { user, loading } = useCurrentUser();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await client.clearStore();
    router.push("/");
    router.refresh();
  };

  if (loading) return <LanguageToggle />;
  if (!user) {
    return (
      <>
        <LanguageToggle />
        <Link href="/register?type=agency" className="btn btn-secondary btn-sm hide-m">
          {t("nav.forOperators")}
        </Link>
        <Link href="/login" className="btn btn-primary btn-sm">
          {t("nav.signIn")}
        </Link>
      </>
    );
  }
  const traveller = user.role === "USER";
  return (
    <>
      <LanguageToggle />
      {traveller && (
        <Link href="/compare" className="plain hide-m" style={{ fontSize: 13.5 }}>
          {t("nav.saved")}
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger className="avatar" title={user.name}>
          {initials(user.name)}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <div className="small muted" style={{ padding: "4px 12px 8px" }}>
            {user.name} · {t(`roles.${user.role}`)}
          </div>
          {traveller && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/trips">{t("nav.myTrips")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/compare">{t("nav.saved")}</Link>
              </DropdownMenuItem>
            </>
          )}
          {user.role === "OPERATOR" && (
            <DropdownMenuItem asChild>
              <Link href="/partner">{t("nav.partnerArea")}</Link>
            </DropdownMenuItem>
          )}
          {STAFF_ROLES.includes(user.role) && (
            <DropdownMenuItem asChild>
              <Link href="/admin/review">{t("nav.adminArea")}</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={logout}>{t("common.logout")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
