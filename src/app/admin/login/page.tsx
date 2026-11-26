import { Suspense } from "react";
import { AdminLoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-charcoal px-4">
      <Suspense>
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
