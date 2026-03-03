import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { FinanceCashflowCard } from "@/components/finance-cashflow-card";
import { ProjectPulseCard } from "@/components/project-pulse-card";
import { NextActionsCard } from "@/components/next-actions-card";
import { RunwayCard } from "@/components/runway-card";
import { HealthPulseCard } from "@/components/health-pulse-card";
import { FamilyPulseCard } from "@/components/family-pulse-card";
import { TransitionPulseCard } from "@/components/transition-pulse-card";
import { LearningPulseCard } from "@/components/learning-pulse-card";
import { MobileQuickActions } from "@/components/mobile-quick-actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await losService.getHomeDashboard();

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Home"
        subtitle="Tier 1 command center: projects, action queue, finance, health, family, and transition signals in one view."
      />
      <MobileQuickActions />

      <section className="grid gap-4 lg:grid-cols-12">
        <FinanceCashflowCard data={data} />
        <ProjectPulseCard projects={data.topProjects} />
        <NextActionsCard tasks={data.nextTasks} />
        <RunwayCard runway={data.runway} />
        <HealthPulseCard overview={data.healthOverview} />
        <LearningPulseCard overview={data.learningOverview} />
        <FamilyPulseCard overview={data.familyOverview} />
        <TransitionPulseCard overview={data.transitionOverview} />
      </section>
    </main>
  );
}
