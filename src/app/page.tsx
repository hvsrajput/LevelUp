// =============================================================================
// Landing page — public, unauthenticated
// =============================================================================

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 sm:py-24 text-center">
        <div className="inline-flex items-center rounded-full border border-border/70 bg-tint px-3.5 py-1 font-mono text-xs font-semibold text-secondary">
          AI-powered DSA practice tracker
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
          Level Up Your
          <br />
          <span className="text-primary">DSA Skills</span>
        </h1>

        <p className="max-w-2xl text-base sm:text-lg text-secondary leading-relaxed">
          Track problems, get AI-suggested approaches and hints, follow
          personalized roadmaps, and practice with your study group — all in
          one place.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="default" className="rounded-lg h-10 px-5 font-semibold text-xs shadow-xs">
            <Link href="/problems">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="default" className="rounded-lg h-10 px-5 font-semibold text-xs bg-card border-border/70 hover:bg-tint">
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-6 px-4 pb-24 md:grid-cols-3"
      >
        <FeatureCard
          title="Track Everything"
          description="Log problems with difficulty, topics, test cases, code submissions, and personal notes. Filter and search across your entire practice history."
        />
        <FeatureCard
          title="AI-Powered Hints"
          description="Get suggested topics, approaches, and progressive hints powered by RAG over curated DSA patterns. Accept, edit, or skip — you're in control."
        />
        <FeatureCard
          title="Study Groups"
          description="Create private groups, share progress, and see who's grinding. Join codes make it easy to invite friends."
        />
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2.5 rounded-xl border border-border/70 bg-card p-5 text-left shadow-xs">
      <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
