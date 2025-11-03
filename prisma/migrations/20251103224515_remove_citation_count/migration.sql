/*
  Warnings:

  - You are about to drop the `SubredditScore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `researchDomain` on the `Subreddit` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "SubredditScore_userId_subredditId_key";

-- DropIndex
DROP INDEX "SubredditScore_score_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SubredditScore";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subreddit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creatorId" TEXT NOT NULL,
    CONSTRAINT "Subreddit_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Subreddit" ("createdAt", "creatorId", "id", "name", "updatedAt") SELECT "createdAt", "creatorId", "id", "name", "updatedAt" FROM "Subreddit";
DROP TABLE "Subreddit";
ALTER TABLE "new_Subreddit" RENAME TO "Subreddit";
CREATE UNIQUE INDEX "Subreddit_name_key" ON "Subreddit"("name");
CREATE INDEX "Subreddit_name_idx" ON "Subreddit"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
