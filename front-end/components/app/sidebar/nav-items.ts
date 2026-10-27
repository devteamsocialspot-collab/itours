import { BadgeCheck, Building2, ClipboardList, Inbox, LayoutDashboard, Map, ShieldCheck, type LucideIcon } from "lucide-react";

export type NavItem = { key: string; icon: LucideIcon; href: string; exact?: boolean; count?: "plans" | "orders" };

/** The travel agency's back office (wireframes 2a–2e). */
export const PARTNER_NAV: NavItem[] = [
  { key: "nav.overview", icon: LayoutDashboard, href: "/partner", exact: true },
  { key: "nav.plans", icon: Map, href: "/partner/plans", count: "plans" },
  { key: "nav.orders", icon: Inbox, href: "/partner/orders", count: "orders" },
  { key: "nav.profile", icon: Building2, href: "/partner/profile" },
];

/** Marketplace staff (wireframe 3a). */
export const ADMIN_NAV: NavItem[] = [
  { key: "nav.reviewQueue", icon: ClipboardList, href: "/admin/review", count: "plans" },
  { key: "nav.health", icon: BadgeCheck, href: "/admin/operators" },
  { key: "nav.staff", icon: ShieldCheck, href: "/admin/users" },
];
