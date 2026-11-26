import { ForgotForm } from "@/components/store/auth-forms";

export const metadata = { title: "Reset password" };

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f6f4f0]">
      <ForgotForm adminMode />
    </main>
  );
}
