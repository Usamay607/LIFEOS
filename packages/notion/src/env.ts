export type LosDataMode = "mock" | "notion";

export interface LosEnv {
  dataMode: LosDataMode;
  notionToken?: string;
  openAiApiKey?: string;
  openAiModel: string;
  timezone: string;
  locale: string;
  currency: string;
  databaseIds: {
    areas?: string;
    entities?: string;
    projects?: string;
    tasks?: string;
    pathways?: string;
    coursesCerts?: string;
    accounts?: string;
    transactions?: string;
    upcomingExpenses?: string;
    metrics?: string;
    healthLogs?: string;
    workouts?: string;
    familyEvents?: string;
    relationshipCheckins?: string;
    timeOffPlans?: string;
    journalEntries?: string;
    reviews?: string;
  };
}

export function loadLosEnv(): LosEnv {
  return {
    dataMode: (process.env.LOS_DATA_MODE as LosDataMode) ?? "mock",
    notionToken: process.env.NOTION_TOKEN,
    openAiApiKey: process.env.OPENAI_API_KEY,
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    timezone: process.env.LOS_TIMEZONE ?? "Australia/Melbourne",
    locale: process.env.LOS_LOCALE ?? "en-AU",
    currency: process.env.LOS_CURRENCY ?? "AUD",
    databaseIds: {
      areas: process.env.NOTION_DATABASE_AREAS_ID,
      entities: process.env.NOTION_DATABASE_ENTITIES_ID,
      projects: process.env.NOTION_DATABASE_PROJECTS_ID,
      tasks: process.env.NOTION_DATABASE_TASKS_ID,
      pathways: process.env.NOTION_DATABASE_PATHWAYS_ID,
      coursesCerts: process.env.NOTION_DATABASE_COURSES_CERTS_ID,
      accounts: process.env.NOTION_DATABASE_ACCOUNTS_ID,
      transactions: process.env.NOTION_DATABASE_TRANSACTIONS_ID,
      upcomingExpenses: process.env.NOTION_DATABASE_UPCOMING_EXPENSES_ID,
      metrics: process.env.NOTION_DATABASE_METRICS_ID,
      healthLogs: process.env.NOTION_DATABASE_HEALTH_LOGS_ID,
      workouts: process.env.NOTION_DATABASE_WORKOUTS_ID,
      familyEvents: process.env.NOTION_DATABASE_FAMILY_EVENTS_ID,
      relationshipCheckins: process.env.NOTION_DATABASE_RELATIONSHIP_CHECKINS_ID,
      timeOffPlans: process.env.NOTION_DATABASE_TIME_OFF_PLANS_ID,
      journalEntries: process.env.NOTION_DATABASE_JOURNAL_ENTRIES_ID,
      reviews: process.env.NOTION_DATABASE_REVIEWS_ID,
    },
  };
}
