-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'sent', 'paid', 'overdue');

-- CreateEnum
CREATE TYPE "booking_fee_status" AS ENUM ('pending', 'invoiced', 'paid', 'waived');

-- DropIndex
DROP INDEX "idx_artists_display_name_trgm";

-- DropIndex
DROP INDEX "idx_cases_description_trgm";

-- DropIndex
DROP INDEX "idx_cases_title_trgm";

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" BIGSERIAL NOT NULL,
    "plan_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "monthly_fee" INTEGER NOT NULL,
    "fee_rate" DECIMAL(5,4) NOT NULL,
    "max_cases" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "artist_id" BIGINT NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "is_trial" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "artist_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" BIGSERIAL NOT NULL,
    "artist_id" BIGINT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "listing_fee" INTEGER NOT NULL DEFAULT 0,
    "total_booking_fees" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "status" "invoice_status" NOT NULL DEFAULT 'draft',
    "issued_at" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_fees" (
    "id" BIGSERIAL NOT NULL,
    "artist_id" BIGINT NOT NULL,
    "booking_id" BIGINT NOT NULL,
    "invoice_id" BIGINT,
    "menu_price" INTEGER NOT NULL,
    "fee_rate" DECIMAL(5,4) NOT NULL,
    "fee_amount" INTEGER NOT NULL,
    "status" "booking_fee_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_plan_code_key" ON "subscription_plans"("plan_code");

-- CreateIndex
CREATE INDEX "idx_subscriptions_artist" ON "artist_subscriptions"("artist_id");

-- CreateIndex
CREATE INDEX "idx_subscriptions_expires" ON "artist_subscriptions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_invoices_period" ON "invoices"("artist_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "booking_fees_booking_id_key" ON "booking_fees"("booking_id");

-- CreateIndex
CREATE INDEX "idx_booking_fees_status" ON "booking_fees"("artist_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE INDEX "idx_artists_trgm" ON "artists"("display_name");

-- CreateIndex
CREATE INDEX "idx_cases_trgm" ON "cases"("title", "description");

-- CreateIndex
CREATE INDEX "idx_menus_artist" ON "menus"("artist_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user_created" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_view_history_dedup" ON "view_history"("target_type", "target_id", "viewed_at" DESC);

-- AddForeignKey
ALTER TABLE "artist_subscriptions" ADD CONSTRAINT "artist_subscriptions_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_subscriptions" ADD CONSTRAINT "artist_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_fees" ADD CONSTRAINT "booking_fees_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_fees" ADD CONSTRAINT "booking_fees_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_fees" ADD CONSTRAINT "booking_fees_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
