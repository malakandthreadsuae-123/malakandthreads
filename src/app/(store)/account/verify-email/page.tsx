import { Suspense } from "react";
import { VerifyEmail } from "@/components/store/auth-forms";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "Verify email", robots: PRIVATE_ROBOTS, referrer: "no-referrer" as const };

export default function Page() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
