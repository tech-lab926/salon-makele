-- Ensure trigram support is available.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Replace the plain btree index on artists.display_name with a trigram GIN index.
DROP INDEX IF EXISTS "idx_artists_trgm";
CREATE INDEX "idx_artists_trgm" ON "artists" USING gin ("display_name" gin_trgm_ops);

-- Replace the plain btree index on cases.title/description with trigram GIN indexes.
DROP INDEX IF EXISTS "idx_cases_trgm";
CREATE INDEX "idx_cases_trgm_title" ON "cases" USING gin ("title" gin_trgm_ops);
CREATE INDEX "idx_cases_trgm_description" ON "cases" USING gin ("description" gin_trgm_ops);
