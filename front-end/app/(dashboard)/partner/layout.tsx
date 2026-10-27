import { RoleGuard } from "@/components/app/role-guard";
import { Sidebar } from "@/components/app/sidebar/sidebar";

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar area="partner" />
      <main className="main-pad">
        <RoleGuard roles={["OPERATOR"]}>{children}</RoleGuard>
      </main>
    </div>
  );
}
