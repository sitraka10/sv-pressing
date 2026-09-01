CREATE TYPE "public"."cash_category" AS ENUM('deposit', 'withdrawal', 'sales', 'other_income', 'operational', 'salary', 'maintenance', 'other_expense', 'client_payment', 'client_express', 'client_delivery', 'client_industrial', 'cash_drawer', 'refund', 'loan', 'grant', 'investment', 'sale_equipment');--> statement-breakpoint
CREATE TYPE "public"."cash_transaction_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."order_late_type" AS ENUM('pickup_late', 'delivery_late', 'status_stuck', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."recurring_frequency" AS ENUM('daily', 'weekly', 'monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."signature_type" AS ENUM('electronic', 'handwritten', 'uploaded');--> statement-breakpoint
ALTER TYPE "public"."contract_status" ADD VALUE 'draft';--> statement-breakpoint
ALTER TYPE "public"."contract_status" ADD VALUE 'pending_signature';--> statement-breakpoint
ALTER TYPE "public"."contract_status" ADD VALUE 'signed';--> statement-breakpoint
ALTER TYPE "public"."contract_status" ADD VALUE 'terminated';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'salaries';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'other';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'detergent_powder';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'detergent_liquid';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'bleach';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'stain_remover';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'degreaser';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'disinfectant';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'washing_machine';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'dryer';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'iron';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'ironing_board';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'steamer';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'boiler';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'extractor';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'folder';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'plastic_packaging';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'cardboard_box';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'hanger';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'garment_bag';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'label_sticker';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'receipt_paper';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'ink_toner';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'office_supplies';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'computer_equipment';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'accounting_software';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'fuel_for_generator';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'fuel_for_vehicle';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'electricity';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'water';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'internet';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'phone';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'solar_maintenance';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'generator_maintenance';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'rent';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'property_tax';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'renovation';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'security';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'cleaning_service';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'overtime';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'bonus';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'social_charges';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'training';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'health_insurance';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'uniform';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'transport_allowance';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'delivery_motorbike';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'delivery_car';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'delivery_staff';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'vehicle_maintenance';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'insurance_vehicle';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'marketing_flyer';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'marketing_social';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'marketing_promo';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'signage';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'radio_tv';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'website';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'accountant';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'legal_fees';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'consulting';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'tax_irsa';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'tax_vat';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'tax_ib';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'municipal_tax';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'business_license';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'bank_fees';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'money_transfer';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'loan_interest';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'insurance_premium';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'staff_meal';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'water_bottles';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'coffee_tea';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'first_aid';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'social_event';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'contingency';--> statement-breakpoint
ALTER TYPE "public"."expense_category" ADD VALUE 'theft_loss';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'order_late';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'supervisor' BEFORE 'agent';--> statement-breakpoint
CREATE TABLE "ads" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"image_url" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"budget_id" integer,
	"category" "expense_category" NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"budget_amount" numeric(10, 2) NOT NULL,
	"spent_amount" numeric(10, 2) NOT NULL,
	"percentage_used" numeric(5, 2) NOT NULL,
	"alert_type" varchar(20) NOT NULL,
	"is_resolved" boolean DEFAULT false,
	"notified_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cash_balance" (
	"id" serial PRIMARY KEY NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "cash_balance_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"balance" numeric(10, 2) NOT NULL,
	"previous_balance" numeric(10, 2) NOT NULL,
	"change_amount" numeric(10, 2) NOT NULL,
	"change_type" "cash_transaction_type" NOT NULL,
	"transaction_id" integer,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "cash_transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"category" "cash_category" NOT NULL,
	"description" text NOT NULL,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"reference" varchar(100),
	"added_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "category_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "expense_category" NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"budget_amount" numeric(10, 2) NOT NULL,
	"spent_amount" numeric(10, 2) DEFAULT '0',
	"alert_threshold" integer DEFAULT 80,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "client_notes_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"order_id" integer,
	"note_id" integer,
	"content" text NOT NULL,
	"note_type" text DEFAULT 'general',
	"created_by" integer NOT NULL,
	"order_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer NOT NULL,
	"version" integer NOT NULL,
	"content" text NOT NULL,
	"changes" text,
	"modified_by" integer,
	"modified_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_late_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"late_type" "order_late_type" NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"late_hours" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"resolved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_by" integer NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"note_type" text DEFAULT 'general',
	"mentions" integer[],
	"client_id" integer,
	"order_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"category" "expense_category" NOT NULL,
	"frequency" "recurring_frequency" NOT NULL,
	"day_of_month" integer,
	"day_of_week" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"last_generated" timestamp,
	"next_generation" timestamp,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "subscription_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "terms" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "category" SET DATA TYPE "public"."expense_category" USING "category"::"public"."expense_category";--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "type" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "items_included" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "pickups_per_week" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "features" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "analytics" ADD COLUMN "late_pickups" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics" ADD COLUMN "late_deliveries" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics" ADD COLUMN "stuck_statuses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "contract_templates" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "contract_templates" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "cancelled_date" timestamp;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "is_auto_renew" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "client_signature" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "company_signature" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signature_type" "signature_type";--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signature_ip" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signature_user_agent" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signed_document_url" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "original_document_url" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "late_details" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "status_changed_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_late" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "late_type" "order_late_type";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "late_detected_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "late_resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "late_hours" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "plan_selections" ADD COLUMN "plan_name" varchar(255);--> statement-breakpoint
ALTER TABLE "plan_selections" ADD COLUMN "plan_type" varchar(50);--> statement-breakpoint
ALTER TABLE "plan_selections" ADD COLUMN "plan_price" varchar(50);--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vehicle_type" text DEFAULT 'motorcycle';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "selected_plan_id" integer;--> statement-breakpoint
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_budget_id_category_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."category_budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_balance" ADD CONSTRAINT "cash_balance_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_balance_history" ADD CONSTRAINT "cash_balance_history_transaction_id_cash_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."cash_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_balance_history" ADD CONSTRAINT "cash_balance_history_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes_history" ADD CONSTRAINT "client_notes_history_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes_history" ADD CONSTRAINT "client_notes_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes_history" ADD CONSTRAINT "client_notes_history_note_id_order_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."order_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes_history" ADD CONSTRAINT "client_notes_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_versions" ADD CONSTRAINT "contract_versions_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_versions" ADD CONSTRAINT "contract_versions_modified_by_users_id_fk" FOREIGN KEY ("modified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_late_history" ADD CONSTRAINT "order_late_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_late_history" ADD CONSTRAINT "order_late_history_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_templates" ADD CONSTRAINT "contract_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_selected_plan_id_subscription_plans_id_fk" FOREIGN KEY ("selected_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;