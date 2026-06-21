import { type Prisma } from "@prisma/client";

type DbClient = Prisma.TransactionClient | {
  $executeRaw: Prisma.TransactionClient["$executeRaw"];
};

/**
 * Recompute all user credibility ranks in a single pass.
 * Ties break on user id (asc) for deterministic ordering.
 * Uses ROW_NUMBER() — O(N log N), not O(N²).
 */
export async function recalculateCredibilityRanks(
  db: DbClient,
): Promise<void> {
  await db.$executeRaw`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY credibilityScore DESC, id ASC) AS rank
      FROM User
    )
    UPDATE User
    SET credibilityRank = (
      SELECT rank FROM ranked WHERE ranked.id = User.id
    )
  `;
}
