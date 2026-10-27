import type { Metadata } from "next";
import { AuthCard } from "@/components/app/auth-card";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return <AuthCard mode="register" />;
}
