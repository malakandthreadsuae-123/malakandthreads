import { Suspense } from "react";
import { RegisterForm } from "@/components/store/auth-forms";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "Create an account", robots: PRIVATE_ROBOTS };

export default function Page() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
