"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LockButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleLock() {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/unlock?locked=1");
      router.refresh();
      setSubmitting(false);
    }
  }

  return (
    <Button aria-label="Lock dashboard" disabled={submitting} onClick={handleLock} variant="ghost">
      <Lock className="h-4 w-4" />
      <span>{submitting ? "Locking..." : "Lock"}</span>
    </Button>
  );
}
