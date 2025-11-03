// prisma/seed-full.ts
import { PrismaClient, VoteType } from "@prisma/client";

const prisma = new PrismaClient();

const scientificSubreddits = [
  "Astrophysics",
  "Neuroscience",
  "QuantumComputing",
  "MolecularBiology",
  "ArtificialIntelligence",
  "ClimateScience",
  "Genetics",
  "Robotics",
  "TheoreticalPhysics",
  "Biotechnology",
  "DataScience",
  "MaterialScience",
  "Ecology",
  "Pharmacology",
  "CognitiveScience",
];

// 100 users
const userData = Array.from({ length: 100 }, (_, i) => ({
  name: `Researcher${i + 1}`,
  email: `researcher${i + 1}@example.com`,
  username: `scientist${i + 1}`,
  credibilityScore: Math.round(1 + Math.random() * 99),
  expertise: scientificSubreddits[Math.floor(Math.random() * scientificSubreddits.length)],
}));

async function main() {
  console.log("🌱 Starting seed...");

  // 1) Upsert users (safe to re-run)
  const users = await Promise.all(
    userData.map((u) =>
      prisma.user.upsert({
        where: { username: u.username },
        update: {},
        create: {
          name: u.name,
          email: u.email,
          username: u.username,
          credibilityScore: u.credibilityScore,
          expertise: u.expertise,
          emailVerified: new Date(),
        },
      })
    )
  );
  console.log(`✅ Created or updated ${users.length} users`);

  // 2) Upsert subreddits
  const subreddits = await Promise.all(
    scientificSubreddits.map(async (name) => {
      const creator = users[Math.floor(Math.random() * users.length)];
      return prisma.subreddit.upsert({
        where: { name },
        update: { creatorId: creator.id },
        create: {
          name,
          creatorId: creator.id,
        },
      });
    })
  );
  console.log(`✅ Created or updated ${subreddits.length} subreddits`);

  // 3) Subscriptions (each user joins 2-5 subreddits)
  for (const user of users) {
    const chosen = [...subreddits].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 4));
    for (const sr of chosen) {
      await prisma.subscription
        .create({
          data: { userId: user.id, subredditId: sr.id },
        })
        .catch((e: any) => {
          if (e.code !== "P2002") throw e; // ignore duplicate subscription
        });
    }
  }
  console.log("✅ Created user subscriptions");

  // 4) Posts (2-4 per subreddit). No citationCount anywhere.
  const posts: Array<{ id: string; title: string }> = [];
  for (const sr of subreddits) {
    const numPosts = 2 + Math.floor(Math.random() * 3); // 2-4
    const subs = await prisma.subscription.findMany({ where: { subredditId: sr.id }, select: { userId: true } });
    const subscriberIds = subs.map((s) => s.userId);

    for (let i = 0; i < numPosts; i++) {
      const authorId = subscriberIds.length
        ? subscriberIds[Math.floor(Math.random() * subscriberIds.length)]
        : users[Math.floor(Math.random() * users.length)].id;

      try {
        const created = await prisma.post.create({
          data: {
            title: `Research in ${sr.name} #${i + 1}`,
            content: { text: `This is a research post about ${sr.name}` },
            authorId,
            subredditId: sr.id,
            researchDomain: sr.name,
            credibilityScore: 0, // votes will change this
          },
        });
        posts.push({ id: created.id, title: created.title });
      } catch (e) {
        console.error("Failed to create post:", sr.name, String((e as any)?.message || e));
      }
    }
  }
  console.log(`✅ Created ${posts.length} posts`);

  // 5) Comments (3-6 each)
  for (const post of posts) {
    const numComments = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numComments; i++) {
      const commenter = users[Math.floor(Math.random() * users.length)];
      try {
        await prisma.comment.create({
          data: {
            text: `Comment ${i + 1} on ${post.title}`,
            authorId: commenter.id,
            postId: post.id,
          },
        });
      } catch (e) {
        console.error("Failed to create comment:", String((e as any)?.message || e));
      }
    }
  }
  console.log("✅ Created comments");

  // 6) Votes (each user votes on 5-10 random posts). Weight = user's credibilityScore / 100
  for (const user of users) {
    const chosen = [...posts].sort(() => Math.random() - 0.5).slice(0, 5 + Math.floor(Math.random() * 6));
    for (const p of chosen) {
      const type = Math.random() > 0.3 ? VoteType.UP : VoteType.DOWN;
      const weight = (user.credibilityScore ?? 1) / 100;
      try {
        await prisma.vote.create({
          data: {
            type,
            userId: user.id,
            postId: p.id,
            weight,
          },
        });
      } catch (e: any) {
        // ignore duplicate vote error
        if (e.code !== "P2002") console.error("Failed to create vote:", String(e?.message || e));
      }

      const inc = type === VoteType.UP ? weight : -weight;
      try {
        await prisma.post.update({ where: { id: p.id }, data: { credibilityScore: { increment: inc } } });
      } catch (e) {
        console.error("Failed to update post credibility:", String((e as any)?.message || e));
      }
    }
  }
  console.log("✅ Created votes and updated post credibility scores");

  // 7) Normalize post credibility 0-100
  const allPosts = await prisma.post.findMany();
  const scores = allPosts.map((p) => p.credibilityScore ?? 0);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  for (const p of allPosts) {
    const raw = p.credibilityScore ?? 0;
    const norm = ((raw - min) / (max - min || 1)) * 100;
    try {
      await prisma.post.update({ where: { id: p.id }, data: { credibilityScore: norm } });
    } catch (e) {
      console.error("Failed to normalize post score:", p.id, String((e as any)?.message || e));
    }
  }
  console.log("✅ Normalized post credibility scores");

  // 8) Update user credibility based on their posts (mix of original and post avg)
  for (const user of users) {
    try {
      const authored = await prisma.post.findMany({ where: { authorId: user.id } });
      if (!authored.length) continue;
      const avg = authored.reduce((s, x) => s + (x.credibilityScore ?? 0), 0) / authored.length;
      const final = (user.credibilityScore ?? 1) * 0.3 + avg * 0.7;
      await prisma.user.update({ where: { id: user.id }, data: { credibilityScore: final } });
    } catch (e) {
      console.error("Failed to update user credibility:", user.username || user.id, String((e as any)?.message || e));
    }
  }
  console.log("✅ Final user credibility updated");

  console.log("🌱 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error in seed script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
