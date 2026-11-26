import { Suspense } from "react";
import { ResetForm } from "@/components/store/auth-forms";

export const metadata = { title: "Choose a new password", referrer: "no-referrer" as const };

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f6f4f0]">
      <Suspense>
        <ResetForm adminMode />
      </Suspense>
    </main>
  );
}
