-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "username" TEXT,
    "photo_url" TEXT,
    "last_username_change" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usernames" (
    "username" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "usernames_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_powers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_powers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_techniques" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_techniques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_creatures" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_creatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "invite_code" TEXT NOT NULL,
    "characters" JSONB NOT NULL,
    "memberIds" JSONB NOT NULL,
    "owner_username" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_rolls" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),

    CONSTRAINT "campaign_rolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_feats" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "codex_feats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_skills" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "codex_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_species" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "codex_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_traits" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "codex_traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_parts" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "codex_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_properties" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "codex_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_equipment" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "codex_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_archetypes" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "codex_archetypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_creature_feats" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "codex_creature_feats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_username_key" ON "user_profiles"("username");

-- CreateIndex
CREATE INDEX "characters_user_id_idx" ON "characters"("user_id");

-- CreateIndex
CREATE INDEX "characters_user_id_updated_at_idx" ON "characters"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "user_powers_user_id_idx" ON "user_powers"("user_id");

-- CreateIndex
CREATE INDEX "user_techniques_user_id_idx" ON "user_techniques"("user_id");

-- CreateIndex
CREATE INDEX "user_items_user_id_idx" ON "user_items"("user_id");

-- CreateIndex
CREATE INDEX "user_creatures_user_id_idx" ON "user_creatures"("user_id");

-- CreateIndex
CREATE INDEX "campaigns_owner_id_idx" ON "campaigns"("owner_id");

-- CreateIndex
CREATE INDEX "campaign_rolls_campaign_id_idx" ON "campaign_rolls"("campaign_id");

-- AddForeignKey
ALTER TABLE "usernames" ADD CONSTRAINT "usernames_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_powers" ADD CONSTRAINT "user_powers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_techniques" ADD CONSTRAINT "user_techniques_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_creatures" ADD CONSTRAINT "user_creatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_rolls" ADD CONSTRAINT "campaign_rolls_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
