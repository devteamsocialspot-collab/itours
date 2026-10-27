import { RoleGuard } from "@/components/app/role-guard";
import { Sidebar } from "@/components/app/sidebar/sidebar";
import { STAFF_ROLES } from "@/lib/types";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Sidebar area="admin" />
      <main className="main-pad">
        <RoleGuard roles={STAFF_ROLES}>{children}</RoleGuard>
      </main>
    </div>
  );
}
