"use client";

import { useAuth } from "../../context/auth-context";

export default function DashboardPage() {
  const { userEmail } = useAuth();
  return (
    <h1 className="text-3xl font-bold text-gray-900">Bienvenido a tu Dashboard, {userEmail}!</h1>
  );
}
