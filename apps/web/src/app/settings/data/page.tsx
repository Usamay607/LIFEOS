import { losService } from "@/lib/los-service";
import { SectionHeader } from "@/components/section-header";
import { DataStudioWorkspace } from "@/components/data-studio-workspace";

export const dynamic = "force-dynamic";

export default async function DataStudioPage() {
  const [
    entities,
    projects,
    pathways,
    courses,
    accounts,
    metrics,
    transactions,
    upcomingExpenses,
    healthLogs,
    workouts,
    familyEvents,
    relationshipCheckins,
    timeOffPlans,
  ] =
    await Promise.all([
      losService.listEntities(false),
      losService.listProjects(),
      losService.listPathways(),
      losService.listCourses(),
      losService.listAccounts(),
      losService.listMetrics(),
      losService.listTransactions(),
      losService.listUpcomingExpenses(true),
      losService.listHealthLogs(),
      losService.listWorkouts(),
      losService.listFamilyEvents(),
      losService.listRelationshipCheckins(),
      losService.listTimeOffPlans(),
    ]);

  return (
    <main className="space-y-4">
      <SectionHeader
        title="Data Studio"
        subtitle="Edit and sync in one place."
      />

      <DataStudioWorkspace
        entities={entities}
        initialProjects={projects}
        initialPathways={pathways}
        initialCourses={courses}
        initialAccounts={accounts}
        initialMetrics={metrics}
        initialTransactions={transactions}
        initialUpcomingExpenses={upcomingExpenses}
        initialHealthLogs={healthLogs}
        initialWorkouts={workouts}
        initialFamilyEvents={familyEvents}
        initialRelationshipCheckins={relationshipCheckins}
        initialTimeOffPlans={timeOffPlans}
      />
    </main>
  );
}
