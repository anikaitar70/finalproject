import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const researchDomains = [
  "Computer Science",
  "Biology",
  "Physics",
  "Mathematics",
  "Chemistry",
  "Psychology",
  "Economics",
  "Engineering",
  "Medicine",
  "Philosophy",
];

function serializeExpertise(domains: string[]): string {
  return domains.map((domain) => domain.trim()).filter(Boolean).join(",");
}

async function main() {
  const users = await prisma.user.findMany();

  console.log(`Found ${users.length} users to update`);

  for (const user of users) {
    const credibilityScore = 1 + Math.random() * 49;
    const credibilityRank = Math.floor(Math.random() * users.length) + 1;
    const numDomains = Math.floor(Math.random() * 3) + 1;
    const expertise = [...researchDomains]
      .sort(() => Math.random() - 0.5)
      .slice(0, numDomains);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        credibilityScore,
        credibilityRank,
        expertise: serializeExpertise(expertise),
        lastScoreUpdate: new Date(),
      },
    });

    console.log(`Updated user ${user.username || user.name || user.id}:`);
    console.log(`  Credibility: ${credibilityScore.toFixed(2)}`);
    console.log(`  Rank: ${credibilityRank}`);
    console.log(`  Expertise: ${expertise.join(", ")}`);
  }

  const posts = await prisma.post.findMany();

  console.log(`\nFound ${posts.length} posts to update`);

  for (const post of posts) {
    const credibilityScore = Math.random() * 30;
    const researchDomain =
      researchDomains[Math.floor(Math.random() * researchDomains.length)];

    await prisma.post.update({
      where: { id: post.id },
      data: {
        credibilityScore,
        researchDomain,
      },
    });

    console.log(`Updated post ${post.title}:`);
    console.log(`  Credibility: ${credibilityScore.toFixed(2)}`);
    console.log(`  Domain: ${researchDomain}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
