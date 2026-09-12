-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('user', 'artist', 'admin');

-- CreateEnum
CREATE TYPE "availability_status" AS ENUM ('available', 'booked', 'blocked');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "avatar_url" VARCHAR(500),
    "role" "user_role" NOT NULL DEFAULT 'user',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "bio" TEXT,
    "area_id" BIGINT NOT NULL,
    "profile_img_url" VARCHAR(500),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "ranking_score" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_skills" (
    "id" BIGSERIAL NOT NULL,
    "artist_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "artist_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" BIGSERIAL NOT NULL,
    "prefecture" VARCHAR(20) NOT NULL,
    "city" VARCHAR(50),
    "sort_order" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "techniques" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" BIGSERIAL NOT NULL,
    "artist_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "technique_id" BIGINT,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "before_img_url" VARCHAR(500) NOT NULL,
    "after_img_url" VARCHAR(500) NOT NULL,
    "session_count" SMALLINT,
    "downtime_days" SMALLINT,
    "downtime_note" VARCHAR(255),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "ranking_score" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" BIGSERIAL NOT NULL,
    "artist_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "price" INTEGER,
    "duration_min" SMALLINT NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "id" BIGSERIAL NOT NULL,
    "artist_id" BIGINT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "status" "availability_status" NOT NULL DEFAULT 'available',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "artist_id" BIGINT NOT NULL,
    "availability_id" BIGINT NOT NULL,
    "menu_id" BIGINT,
    "status" "booking_status" NOT NULL DEFAULT 'pending',
    "user_note" TEXT,
    "artist_note" TEXT,
    "cancelled_by" VARCHAR(20),
    "cancelled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "ref_id" BIGINT,
    "ref_type" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" BIGSERIAL NOT NULL,
    "author_id" BIGINT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "slug" VARCHAR(300) NOT NULL,
    "body" TEXT NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "blog_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("blog_id","category_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "verified_at" TIMESTAMPTZ,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "view_history" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "session_key" VARCHAR(64),
    "target_type" VARCHAR(20) NOT NULL,
    "target_id" BIGINT NOT NULL,
    "viewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "view_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_scores" (
    "id" BIGSERIAL NOT NULL,
    "target_type" VARCHAR(20) NOT NULL,
    "target_id" BIGINT NOT NULL,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "like_count" BIGINT NOT NULL DEFAULT 0,
    "review_count" BIGINT NOT NULL DEFAULT 0,
    "review_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "score" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "artists_user_id_key" ON "artists"("user_id");

-- CreateIndex
CREATE INDEX "idx_artists_area" ON "artists"("area_id");

-- CreateIndex
CREATE INDEX "idx_artists_published" ON "artists"("is_published");

-- CreateIndex
CREATE INDEX "idx_artists_ranking" ON "artists"("ranking_score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "artist_skills_artist_id_category_id_key" ON "artist_skills"("artist_id", "category_id");

-- CreateIndex
CREATE INDEX "idx_areas_prefecture" ON "areas"("prefecture");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "techniques_name_key" ON "techniques"("name");

-- CreateIndex
CREATE INDEX "idx_cases_artist" ON "cases"("artist_id");

-- CreateIndex
CREATE INDEX "idx_cases_category" ON "cases"("category_id");

-- CreateIndex
CREATE INDEX "idx_cases_published" ON "cases"("is_published");

-- CreateIndex
CREATE INDEX "idx_cases_ranking" ON "cases"("ranking_score" DESC);

-- CreateIndex
CREATE INDEX "idx_cases_search" ON "cases"("category_id", "artist_id");

-- CreateIndex
CREATE INDEX "idx_availability_artist_date" ON "availability"("artist_id", "date");

-- CreateIndex
CREATE INDEX "idx_availability_status" ON "availability"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_availability_id_key" ON "bookings"("availability_id");

-- CreateIndex
CREATE INDEX "idx_bookings_user" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "idx_bookings_artist" ON "bookings"("artist_id");

-- CreateIndex
CREATE INDEX "idx_bookings_status" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "idx_notifications_user_read" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");

-- CreateIndex
CREATE INDEX "idx_blogs_published" ON "blogs"("is_published", "published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "idx_sessions_expires" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_token_key" ON "email_verifications"("token");

-- CreateIndex
CREATE INDEX "idx_view_history_user" ON "view_history"("user_id", "viewed_at" DESC);

-- CreateIndex
CREATE INDEX "idx_view_history_session" ON "view_history"("session_key", "viewed_at" DESC);

-- CreateIndex
CREATE INDEX "idx_ranking_scores_score" ON "ranking_scores"("score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ranking_scores_target_type_target_id_key" ON "ranking_scores"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_skills" ADD CONSTRAINT "artist_skills_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_skills" ADD CONSTRAINT "artist_skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "techniques" ADD CONSTRAINT "techniques_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_technique_id_fkey" FOREIGN KEY ("technique_id") REFERENCES "techniques"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "availability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_blog_id_fkey" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "view_history" ADD CONSTRAINT "view_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
