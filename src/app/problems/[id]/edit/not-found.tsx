// =============================================================================
// Not Found state for Edit Problem
// =============================================================================

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditProblemNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Problem Not Found
      </h2>
      <p className="mt-2 text-sm text-secondary">
        The problem you are trying to edit does not exist or you do not have permission to view it.
      </p>
      <Button asChild className="mt-6 rounded-[14px]" variant="outline">
        <Link href="/problems">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Problems
        </Link>
      </Button>
    </div>
  );
}
