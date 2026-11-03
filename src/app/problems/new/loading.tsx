// =============================================================================
// Loading skeleton for Add New Problem
// =============================================================================

export default function NewProblemLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-64 rounded-[12px] bg-tint" />
        <div className="h-4 w-96 rounded-[8px] bg-tint" />
      </div>

      <div className="rounded-[24px] border border-border/70 bg-card p-6 sm:p-8 space-y-6">
        <div className="h-6 w-48 rounded-[10px] bg-tint" />
        <div className="h-10 w-full rounded-[14px] bg-tint" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 rounded-[14px] bg-tint" />
          <div className="h-10 rounded-[14px] bg-tint" />
        </div>
        <div className="h-32 rounded-[14px] bg-tint" />
      </div>
    </div>
  );
}
