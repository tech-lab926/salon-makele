-- Deduplicate identical artist/date/start_time rows (keep smallest id)
DELETE FROM "availability" a
WHERE a."id" IN (
  SELECT "id" FROM (
    SELECT "id",
      ROW_NUMBER() OVER (
        PARTITION BY "artist_id", "date", "start_time"
        ORDER BY "id"
      ) AS rn
    FROM "availability"
  ) t
  WHERE t.rn > 1
);

CREATE UNIQUE INDEX "uq_availability_artist_slot" ON "availability"("artist_id", "date", "start_time");
