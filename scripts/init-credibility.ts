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

function formatExpertise(value: string): string {
  if (!value.trim()) {
    return "None";
  }

  return value
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean)
    .join(", ");
}

async function createTestUsers() {
  const existingCount = await prisma.user.count();

  if (existingCount === 0) {
    const testUsers = [
      { name: "Alice Research", username: "alice_research" },
      { name: "Bob Science", username: "bob_science" },
      { name: "Carol Scholar", username: "carol_scholar" },
      { name: "David Academic", username: "david_academic" },
      { name: "Eva Professor", username: "eva_professor" },
    ];

    for (const user of testUsers) {
      await prisma.user.create({
        data: {
          name: user.name,
          username: user.username,
          email: `${user.username}@example.com`,
          credibilityScore: 1.0,
          credibilityRank: 0,
          expertise: "",
        },
      });
    }

    console.log("Created test users");
  }
}

async function main() {
  await createTestUsers();

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
      },
    });

    console.log(`Updated user ${user.username || user.name || user.id}:`);
    console.log(`  Credibility: ${credibilityScore.toFixed(2)}`);
    console.log(`  Rank: ${credibilityRank}`);
    console.log(`  Expertise: ${expertise.join(", ")}`);
  }

  const updatedUsers = await prisma.user.findMany({
    orderBy: {
      credibilityScore: "desc",
    },
  });

  console.log("\nTop users by credibility:");
  updatedUsers.forEach((user, i) => {
    console.log(`${i + 1}. ${user.username || user.name || user.id}`);
    console.log(`   Score: ${user.credibilityScore.toFixed(2)}`);
    console.log(`   Rank: ${user.credibilityRank}`);
    console.log(`   Expertise: ${formatExpertise(user.expertise)}`);
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
