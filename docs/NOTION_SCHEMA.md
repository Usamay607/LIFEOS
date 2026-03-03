# LOS Notion Schema

The service expects these database names/IDs and property keys.

## Areas
- `name` (title)
- `color` (select)
- `active` (checkbox)

## Entities
- `name` (title)
- `area` (relation -> Areas)
- `type` (select)
- `status` (select: `ACTIVE|DORMANT|ARCHIVED`)
- `priority` (number 1-5)
- `notes` (rich_text)

## Projects
- `name` (title)
- `entity` (relation -> Entities)
- `status` (select: `ACTIVE|ON_HOLD|CEASED`)
- `next_milestone` (rich_text)
- `deadline` (date)
- `skills_used` (relation -> CoursesCerts)
- `post_mortem` (rich_text; required when status is `CEASED`)

## Tasks
- `title` (title)
- `project` (relation -> Projects)
- `status` (select: `NEXT|DOING|WAITING|DONE`)
- `due_date` (date)
- `energy` (select: `LOW|MEDIUM|HIGH`)
- `context` (select: `LAPTOP|PHONE|ERRANDS|CALLS`)
- `recurring` (checkbox)
- `notes` (rich_text)
- `created_at` (date)

## Pathways
- `title` (title)
- `status` (select: `ACTIVE|LATER|COMPLETED`)
- `progress_percent` (number)

## CoursesCerts
- `course_cert` (title)
- `pathway` (relation -> Pathways)
- `status` (select: `NOT_STARTED|IN_PROGRESS|COMPLETED`)
- `target_date` (date, optional)
- `estimated_hours` (number, optional)
- `completed_hours` (number, optional)
- `proof` (files)
- `applied_projects` (relation -> Projects)
- `applied_progress_percent` (number)

## Accounts
- `service` (title)
- `entity` (relation -> Entities)
- `login_identifier` (rich_text)
- `role` (select: `OWNER|ADMIN|USER`)
- `2fa_enabled` (checkbox)
- `vault_item_url` (rich_text)
- `vault_item_id` (rich_text)
- `last_rotated` (date)
- `notes` (rich_text)

## Transactions
- `date` (date)
- `amount` (number)
- `type` (select: `INCOME|EXPENSE`)
- `entity` (relation -> Entities)
- `category` (select)
- `notes` (rich_text)

## UpcomingExpenses
- `bill` (title)
- `amount` (number)
- `due_date` (date)
- `frequency` (select)
- `entity` (relation -> Entities)
- `paid` (checkbox)

## Metrics
- `metric_name` (title)
- `category` (select)
- `value` (number)
- `unit` (select)
- `date` (date)
- `entity` (relation -> Entities, optional)
- `project` (relation -> Projects, optional)

## HealthLogs
- `date` (date)
- `entity` (relation -> Entities)
- `steps` (number)
- `sleep_hours` (number)
- `resting_hr` (number)
- `hydration_liters` (number)
- `recovery_score` (number)
- `weight_kg` (number, optional)

## Workouts
- `date` (date)
- `entity` (relation -> Entities)
- `session_type` (select: `STRENGTH|CARDIO|MOBILITY|SPORT|RECOVERY`)
- `intensity` (select: `LOW|MEDIUM|HIGH`)
- `duration_minutes` (number)
- `volume_load_kg` (number, optional)
- `notes` (rich_text)

## FamilyEvents
- `title` (title)
- `date` (date)
- `category` (select: `BIRTHDAY|ANNIVERSARY|SOCIAL|FAMILY|ADMIN`)
- `importance` (select: `LOW|MEDIUM|HIGH`)
- `entity` (relation -> Entities, optional)
- `notes` (rich_text, optional)

## RelationshipCheckins
- `person` (title)
- `relation_type` (select: `FAMILY|FRIEND|MENTOR|PARTNER`)
- `last_meaningful_contact` (date)
- `target_cadence_days` (number)
- `entity` (relation -> Entities, optional)
- `notes` (rich_text, optional)

## TimeOffPlans
- `title` (title)
- `status` (select: `PRE_SABBATICAL|READY|ACTIVE_TIME_OFF|COMPLETED`)
- `target_date` (date, optional)
- `estimated_cost_aud` (number)
- `priority` (select: `LOW|MEDIUM|HIGH`)
- `entity` (relation -> Entities, optional)
- `notes` (rich_text, optional)

## JournalEntries
- `title` (title)
- `date` (date)
- `entry` (rich_text)
- `mood` (select: `GREAT|GOOD|NEUTRAL|LOW`)
- `tags` (multi_select)
- `entity` (relation -> Entities, optional)
- `energy_score` (number, optional)
- `focus_score` (number, optional)

## Reviews
- `review_date` (date)
- `wins` (rich_text)
- `stuck` (rich_text)
- `top_three_next_week` (rich_text)
- `runway_commentary` (rich_text)
