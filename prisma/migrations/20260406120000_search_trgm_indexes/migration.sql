-- Speed up ILIKE / contains search on text fields (requires pg_trgm).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "idx_cases_title_trgm" ON "cases" USING gin ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_cases_description_trgm" ON "cases" USING gin ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_artists_display_name_trgm" ON "artists" USING gin ("display_name" gin_trgm_ops);
