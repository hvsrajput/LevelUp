// =============================================================================
// Edit problem page — Server Component
// =============================================================================

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProblemForm } from "@/components/problem-form";
import { toFormValues } from "@/lib/problem/form-values";
import { CheckCircle2 } from "lucide-react";

interface EditProblemPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EditProblemPage({
  params,
  searchParams,
}: EditProblemPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const notice =
    typeof resolvedSearchParams?.notice === "string"
      ? resolvedSearchParams.notice
      : undefined;

  // Load problem by ID or shortCode AND ensure user ownership
  const problem = await prisma.problem.findFirst({
    where: {
      OR: [{ id }, { shortCode: id }],
      userId: session.user.id,
    },
    include: {
      topics: { include: { topic: true } },
      testCases: true,
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!problem) {
    notFound();
  }

  const initialValues = toFormValues(problem);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      {notice && (
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-[#D6EEC6] p-3 text-xs font-semibold text-badge-solved-text border border-badge-solved-text/20">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-badge-solved-text" />
          <span>{notice}</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Edit Problem</h1>
        <p className="mt-1 text-xs text-secondary">
          Update &ldquo;{problem.title}&rdquo;
        </p>
      </div>

      <ProblemForm
        key={problem.id}
        mode="edit"
        initialValues={initialValues}
      />
    </div>
  );
}
