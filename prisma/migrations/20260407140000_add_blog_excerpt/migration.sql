-- List-friendly preview text; avoids loading full HTML body on blog index/API lists.
ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "excerpt" VARCHAR(400);

UPDATE "blogs"
SET "excerpt" = LEFT(
  TRIM(REGEXP_REPLACE(REGEXP_REPLACE("body", '<[^>]*>', ' ', 'g'), '\s+', ' ', 'g')),
  400
)
WHERE "excerpt" IS NULL;
