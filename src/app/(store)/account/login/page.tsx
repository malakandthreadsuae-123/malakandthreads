import { Suspense } from "react";
import { LoginForm } from "@/components/store/auth-forms";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "Sign in", robots: PRIVATE_ROBOTS, alternates: { canonical: "/account/login" } };

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
