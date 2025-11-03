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

// Create some test users if none exist
async function createTestUsers() {
  const existingCount = await prisma.user.count();
  
  if (existingCount === 0) {
    const testUsers = [
      { name: "Alice Research", username: "alice_research" },
      { name: "Bob Science", username: "bob_science" },
      { name: "Carol Scholar", username: "carol_scholar" },
      { name: "David Academic", username: "david_academic" },
      { name: "Eva Professor", username: "eva_professor" }
    ];

    for (const user of testUsers) {
      await prisma.user.create({
        data: {
          name: user.name,
          username: user.username,
          email: `${user.username}@example.com`,
          credibilityScore: 1.0,
          credibilityRank: 0,
          expertise: [],
        }
      });
    }

    console.log("Created test users");
  }
}

async function main() {
  await createTestUsers();

  // Get all users
  const users = await prisma.user.findMany();
  
  console.log(`Found ${users.length} users to update`);

  // Update each user with random credibility scores
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
        expertise
      }
    });

    console.log(`Updated user ${user.username || user.name || user.id}:`);
    console.log(`  Credibility: ${credibilityScore.toFixed(2)}`);
    console.log(`  Rank: ${credibilityRank}`);
    console.log(`  Expertise: ${expertise.join(", ")}`);
  }

  // Show final state
  const updatedUsers = await prisma.user.findMany({
    orderBy: {
      credibilityScore: 'desc'
    }
  });

  console.log("\nTop users by credibility:");
  updatedUsers.forEach((user, i) => {
    console.log(`${i + 1}. ${user.username || user.name || user.id}`);
    console.log(`   Score: ${user.credibilityScore.toFixed(2)}`);
    console.log(`   Rank: ${user.credibilityRank}`);
    console.log(`   Expertise: ${user.expertise.join(", ")}`);
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