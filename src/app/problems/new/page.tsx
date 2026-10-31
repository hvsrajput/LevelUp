// =============================================================================
// Create problem page — Server Component
// =============================================================================

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProblemForm } from "@/components/problem-form";
import { toFormValues } from "@/lib/problem/form-values";
import { getCatalogProblemById } from "@/lib/catalog/service";

interface NewProblemPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewProblemPage({ searchParams }: NewProblemPageProps) {
  const resolvedSearchParams = await searchParams;
  const catalogIdRaw = resolvedSearchParams?.catalogId;
  const catalogId = typeof catalogIdRaw === "string" ? catalogIdRaw : undefined;

  let initialValues = undefined;

  if (catalogId) {
    const session = await auth();
    const catalogItem = await getCatalogProblemById(catalogId);

    if (catalogItem) {
      // If the user already has a problem for this catalog item, redirect to edit
      if (session?.user?.id) {
        const existing = await prisma.problem.findFirst({
          where: {
            userId: session.user.id,
            OR: [
              { catalogProblemId: catalogId },
              ...(catalogItem.id ? [{ catalogProblemId: catalogItem.id }] : []),
              ...(catalogItem.leetcodeQuestionId
                ? [{ leetcodeQuestionId: catalogItem.leetcodeQuestionId }]
                : []),
              { title: { equals: catalogItem.title, mode: "insensitive" } },
            ],
          },
          select: { id: true, shortCode: true },
        });

        if (existing) {
          redirect(
            `/problems/${existing.shortCode || existing.id}/edit?notice=${encodeURIComponent(
              "Already in your problems"
            )}`
          );
        }
      }

      initialValues = toFormValues(catalogItem);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Add New Problem</h1>
        <p className="mt-1 text-xs text-secondary">
          Track a new DSA problem you&apos;re working on.
        </p>
      </div>
      <ProblemForm mode="create" initialValues={initialValues} />
    </div>
  );
}
