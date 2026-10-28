// =============================================================================
// Landing page — public, unauthenticated
// =============================================================================

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Target, Zap, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-24 text-center">
        <div className="flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
          <Zap className="h-4 w-4 text-yellow-500" />
          AI-powered DSA practice tracker
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Level Up Your
          <br />
          <span className="text-primary">DSA Skills</span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground">
          Track problems, get AI-suggested approaches and hints, follow
          personalized roadmaps, and practice with your study group — all in
          one place.
        </p>

        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/problems">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 pb-24 md:grid-cols-3"
      >
        <FeatureCard
          icon={<Target className="h-8 w-8 text-primary" />}
          title="Track Everything"
          description="Log problems with difficulty, topics, test cases, code submissions, and personal notes. Filter and search across your entire practice history."
        />
        <FeatureCard
          icon={<Zap className="h-8 w-8 text-yellow-500" />}
          title="AI-Powered Hints"
          description="Get suggested topics, approaches, and progressive hints powered by RAG over curated DSA patterns. Accept, edit, or skip — you're in control."
        />
        <FeatureCard
          icon={<Users className="h-8 w-8 text-blue-500" />}
          title="Study Groups"
          description="Create private groups, share progress, and see who's grinding. Join codes make it easy to invite friends."
        />
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border p-6 text-center">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
