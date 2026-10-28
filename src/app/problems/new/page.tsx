// =============================================================================
// Create problem page
// =============================================================================

import { ProblemForm } from "@/components/problem-form";

export default function NewProblemPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Problem</h1>
        <p className="mt-1 text-muted-foreground">
          Track a new DSA problem you&apos;re working on.
        </p>
      </div>
      <ProblemForm />
    </div>
  );
}
