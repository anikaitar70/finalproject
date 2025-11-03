/*
  Warnings:

  - You are about to drop the column `citationCount` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `lastConsensusUpdate` on the `Post` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SubredditScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subredditId" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 1.0,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubredditScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SubredditScore_subredditId_fkey" FOREIGN KEY ("subredditId") REFERENCES "Subreddit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "credibilityScore" REAL NOT NULL DEFAULT 0.0,
    "authorId" TEXT NOT NULL,
    "subredditId" TEXT NOT NULL,
    "researchDomain" TEXT,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Post_subredditId_fkey" FOREIGN KEY ("subredditId") REFERENCES "Subreddit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "content", "createdAt", "credibilityScore", "id", "researchDomain", "subredditId", "title", "updatedAt") SELECT "authorId", "content", "createdAt", coalesce("credibilityScore", 0.0) AS "credibilityScore", "id", "researchDomain", "subredditId", "title", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_credibilityScore_idx" ON "Post"("credibilityScore");
CREATE INDEX "Post_researchDomain_idx" ON "Post"("researchDomain");
CREATE TABLE "new_Subreddit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "researchDomain" TEXT NOT NULL DEFAULT 'General',
    "creatorId" TEXT NOT NULL,
    CONSTRAINT "Subreddit_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Subreddit" ("createdAt", "creatorId", "id", "name", "updatedAt") SELECT "createdAt", "creatorId", "id", "name", "updatedAt" FROM "Subreddit";
DROP TABLE "Subreddit";
ALTER TABLE "new_Subreddit" RENAME TO "Subreddit";
CREATE UNIQUE INDEX "Subreddit_name_key" ON "Subreddit"("name");
CREATE INDEX "Subreddit_name_idx" ON "Subreddit"("name");
CREATE INDEX "Subreddit_researchDomain_idx" ON "Subreddit"("researchDomain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SubredditScore_score_idx" ON "SubredditScore"("score");

-- CreateIndex
CREATE UNIQUE INDEX "SubredditScore_userId_subredditId_key" ON "SubredditScore"("userId", "subredditId");
