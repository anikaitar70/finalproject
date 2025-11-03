import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // First let's check if we have any users
  const userCount = await prisma.user.count();
  console.log(`Total users in database: ${userCount}`);

  // Get all users with their basic info
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true
    }
  });

  console.log("\nAll users in database:");
  users.forEach(user => {
    console.log(`- ${user.username || user.name || user.email || user.id}`);
  });
}

main()
  .catch(e => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });