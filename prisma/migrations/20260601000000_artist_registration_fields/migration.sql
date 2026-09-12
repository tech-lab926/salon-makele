-- CreateEnum
CREATE TYPE "artist_registration_status" AS ENUM ('provisional', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "artists" ADD COLUMN "medical_license_url" VARCHAR(500);
ALTER TABLE "artists" ADD COLUMN "artmake_diploma_url" VARCHAR(500);
ALTER TABLE "artists" ADD COLUMN "registration_status" "artist_registration_status" NOT NULL DEFAULT 'provisional';
