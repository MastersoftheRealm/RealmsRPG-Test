-- Create public library tables in codex schema (Prisma expects codex.public_*)
-- If the 20260208003835_add_public_library migration created them in public schema,
-- this creates the correct tables in codex so GET /api/public/[type] works.

CREATE TABLE IF NOT EXISTS codex.public_powers (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "public_powers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS codex.public_techniques (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "public_techniques_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS codex.public_items (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "public_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS codex.public_creatures (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    CONSTRAINT "public_creatures_pkey" PRIMARY KEY ("id")
);
