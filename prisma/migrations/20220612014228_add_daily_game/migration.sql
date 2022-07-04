-- CreateTable
CREATE TABLE "DailyGame" (
    "key" TEXT NOT NULL,
    "date" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyGame_key_key" ON "DailyGame"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DailyGame_date_key" ON "DailyGame"("date");
