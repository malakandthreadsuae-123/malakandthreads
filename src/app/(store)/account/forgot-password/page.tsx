import { ForgotForm } from "@/components/store/auth-forms";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { title: "Forgot password", robots: PRIVATE_ROBOTS };

export default function Page() {
  return <ForgotForm />;
}
