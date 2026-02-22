-- CreateTable: user species (private codex) for Species Creator
CREATE TABLE "users"."user_species" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "user_species_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_species_user_id_idx" ON "users"."user_species"("user_id");

-- AddForeignKey
ALTER TABLE "users"."user_species" ADD CONSTRAINT "user_species_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"."user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
