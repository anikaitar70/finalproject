import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get top 10 users by credibility
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      credibilityScore: true,
      credibilityRank: true,
      expertise: true,
      _count: {
        select: {
          posts: true
        }
      }
    },
    orderBy: {
      credibilityScore: 'desc'
    },
    take: 10
  });

  console.log("\nTop 10 Users by Credibility Score:\n");
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.username || user.name || user.id}`);
    console.log(`   Credibility: ${user.credibilityScore.toFixed(2)}`);
    console.log(`   Rank: ${user.credibilityRank}`);
    console.log(`   Expertise: ${user.expertise.join(", ")}`);
    console.log(`   Posts: ${user._count.posts}`);
    console.log();
  });
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });