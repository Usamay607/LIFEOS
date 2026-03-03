# LOS v1 Automations

## 1) Task completion -> learning application update
- Endpoint: `POST /api/hooks/task-completed`
- Body:
```json
{
  "taskId": "task_123",
  "courseCertIds": ["course_abc"]
}
```
- If `courseCertIds` is omitted, LOS uses linked project skills.

## 2) Weekly summary generation
- Endpoint: `POST /api/reviews/weekly-summary`
- Body contract:
```json
{
  "reviewDate": "2026-03-03T00:00:00.000Z",
  "taskWindowDays": 7,
  "redactionLevel": "STRICT"
}
```

## 3) Upcoming expenses reminder
- Read endpoint: `GET /api/dashboard/home`
- Automation query should inspect `upcomingExpenses` and alert when due in <= 3 days.

## 4) Health sync ingestion (optional)
- Read endpoint: `GET /api/health/overview`
- Use this to post a daily digest or monitor recovery drift week-over-week.

## 5) Family relationship reminders (optional)
- Read endpoint: `GET /api/family/overview`
- Trigger reminders from `overdueRelationships` and `dueSoonRelationships`.

## 6) Transition readiness pulse (optional)
- Read endpoint: `GET /api/transition/overview`
- Alert when `atRiskPlans` is non-empty or readiness score drops below threshold.

## 7) Learning deadline pulse (optional)
- Read endpoint: `GET /api/learning/overview`
- Alert when `upcomingCourseDeadlines` includes `atRisk=true` or impact score drops below threshold.

## 8) Journal weekly digest (optional)
- Read endpoint: `GET /api/journal?limit=7`
- Trigger a weekly summary that highlights mood, energy, focus drift, and repeated tags.
