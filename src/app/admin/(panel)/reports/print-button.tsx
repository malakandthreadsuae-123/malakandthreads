"use client";

import { Printer } from "lucide-react";
import { adminBtnOutline } from "@/components/admin/ui";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={adminBtnOutline}>
      <Printer className="h-4 w-4" aria-hidden /> Print
    </button>
  );
}
