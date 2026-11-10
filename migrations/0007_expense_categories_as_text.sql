-- Expense categories are user-facing labels and have changed between enum
-- versions. Store them as text so the UI and database accept the same values.
ALTER TABLE "expenses"
  ALTER COLUMN "category" TYPE text USING "category"::text;--> statement-breakpoint

ALTER TABLE "category_budgets"
  ALTER COLUMN "category" TYPE text USING "category"::text;--> statement-breakpoint

ALTER TABLE "budget_alerts"
  ALTER COLUMN "category" TYPE text USING "category"::text;--> statement-breakpoint

ALTER TABLE "recurring_expenses"
  ALTER COLUMN "category" TYPE text USING "category"::text;
