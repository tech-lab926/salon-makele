-- OAuth / Google sign-up users don't use a stored password hash.
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
