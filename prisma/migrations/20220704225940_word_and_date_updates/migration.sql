/*
  Warnings:

  - You are about to alter the column `addedAt` on the `GameWord` table. The data in that column could be lost. The data in that column will be cast from `Int` to `DateTime`.
  - You are about to drop the column `maxScore` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `maxWords` on the `Game` table. All the data in the column will be lost.
  - You are about to alter the column `addedAt` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `Int` to `DateTime`.
  - You are about to alter the column `expires` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `Int` to `DateTime`.

*/
-- CreateTable
CREATE TABLE "Word" (
    "word" TEXT NOT NULL,
    "rating" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameWord" (
    "word" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    CONSTRAINT "GameWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "GameWord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_GameWord" ("addedAt", "gameId", "userId", "word") SELECT "addedAt", "gameId", "userId", "word" FROM "GameWord";
DROP TABLE "GameWord";
ALTER TABLE "new_GameWord" RENAME TO "GameWord";
CREATE UNIQUE INDEX "GameWord_gameId_word_key" ON "GameWord"("gameId", "word");
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_Game" ("addedAt", "id", "key", "userId") SELECT "addedAt", "id", "key", "userId" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE UNIQUE INDEX "Game_userId_key_key" ON "Game"("userId", "key");
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_Session" ("data", "expires", "id", "userId") SELECT "data", "expires", "id", "userId" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Word_word_key" ON "Word"("word");
