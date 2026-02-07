-- CreateTable
CREATE TABLE "encounters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "encounters_user_id_idx" ON "encounters"("user_id");

-- CreateIndex
CREATE INDEX "encounters_user_id_updated_at_idx" ON "encounters"("user_id", "updated_at");
