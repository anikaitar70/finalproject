import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Research domains for testing
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
  "Philosophy"
];

async function main() {
  // Get all users
  const users = await prisma.user.findMany();
  
  console.log(`Found ${users.length} users to update`);

  // Update each user with random credibility scores and expertise
  for (const user of users) {
    // Random credibility score between 1 and 50
    const credibilityScore = 1 + Math.random() * 49;
    
    // Random credibility rank between 1 and total users
    const credibilityRank = Math.floor(Math.random() * users.length) + 1;
    
    // Assign 1-3 random research domains
    const numDomains = Math.floor(Math.random() * 3) + 1;
    const expertise = [...researchDomains]
      .sort(() => Math.random() - 0.5)
      .slice(0, numDomains);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        credibilityScore,
        credibilityRank,
        expertise,
        lastScoreUpdate: new Date()
      }
    });

    console.log(`Updated user ${user.username || user.name || user.id}:`);
    console.log(`  Credibility: ${credibilityScore.toFixed(2)}`);
    console.log(`  Rank: ${credibilityRank}`);
    console.log(`  Expertise: ${expertise.join(", ")}`);
  }

  // Also update posts with random credibility scores
  const posts = await prisma.post.findMany();
  
  console.log(`\nFound ${posts.length} posts to update`);

  for (const post of posts) {
    const credibilityScore = Math.random() * 30; // Lower initial scores for posts
    const researchDomain = researchDomains[Math.floor(Math.random() * researchDomains.length)];
    const citationCount = Math.floor(Math.random() * 10);

    await prisma.post.update({
      where: { id: post.id },
      data: {
        credibilityScore,
        researchDomain,
        citationCount,
        lastConsensusUpdate: new Date()
      }
    });

    console.log(`Updated post ${post.title}:`);
    console.log(`  Credibility: ${credibilityScore.toFixed(2)}`);
    console.log(`  Domain: ${researchDomain}`);
    console.log(`  Citations: ${citationCount}`);
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