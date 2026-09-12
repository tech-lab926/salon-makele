-- Multi-hour booking: track which availability rows a booking blocked (REQUIREMENTS §8.2).
ALTER TABLE "availability" ADD COLUMN "blocked_by_booking_id" BIGINT;

ALTER TABLE "availability"
  ADD CONSTRAINT "availability_blocked_by_booking_id_fkey"
  FOREIGN KEY ("blocked_by_booking_id") REFERENCES "bookings"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "idx_availability_blocked_by_booking" ON "availability"("blocked_by_booking_id");

-- REQUIREMENTS §10 index design: email_verifications.expires_at
CREATE INDEX "idx_email_verifications_expires" ON "email_verifications"("expires_at");
