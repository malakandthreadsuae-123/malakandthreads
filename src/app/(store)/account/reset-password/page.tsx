import { Suspense } from "react";
import { ResetForm } from "@/components/store/auth-forms";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "Reset password", robots: PRIVATE_ROBOTS, referrer: "no-referrer" as const };

export default function Page() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
