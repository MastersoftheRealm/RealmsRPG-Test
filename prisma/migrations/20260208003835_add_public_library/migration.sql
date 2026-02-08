-- CreateTable
CREATE TABLE "public_powers" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "public_powers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_techniques" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "public_techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_items" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "public_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_creatures" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "public_creatures_pkey" PRIMARY KEY ("id")
);
