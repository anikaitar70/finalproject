import { PrismaClient, VoteType } from "@prisma/client";

import { recalculateCredibilityRanks } from "../src/lib/credibility-ranks";
import { computeVoteWeight } from "../src/lib/credibility";
import {
  DEMO_USERS,
  makeEditorContent,
  POSTS_PER_USER,
  serializeExpertise,
  TAKE_TEMPLATES,
} from "./seed-demo-data";

const prisma = new PrismaClient();

const DEMO_EMAIL_SUFFIX = "@credranknet.demo";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickTakeTemplates(count: number, offset: number) {
  const pool = [...TAKE_TEMPLATES];
  const selected = [];
  for (let i = 0; i < count; i++) {
    selected.push(pool[(offset + i) % pool.length]!);
  }
  return selected;
}

async function clearDemoData() {
  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_EMAIL_SUFFIX } },
    select: { id: true },
  });

  if (demoUsers.length === 0) {
    return;
  }

  const demoUserIds = demoUsers.map((u) => u.id);

  await prisma.commentVote.deleteMany({
    where: { userId: { in: demoUserIds } },
  });
  await prisma.vote.deleteMany({ where: { userId: { in: demoUserIds } } });
  await prisma.comment.deleteMany({ where: { authorId: { in: demoUserIds } } });
  await prisma.post.deleteMany({ where: { authorId: { in: demoUserIds } } });
  await prisma.subscription.deleteMany({
    where: { userId: { in: demoUserIds } },
  });

  const demoSubreddits = await prisma.subreddit.findMany({
    where: { creatorId: { in: demoUserIds } },
    select: { id: true },
  });

  for (const subreddit of demoSubreddits) {
    const remainingPosts = await prisma.post.count({
      where: { subredditId: subreddit.id },
    });
    if (remainingPosts === 0) {
      await prisma.subreddit.delete({ where: { id: subreddit.id } });
    }
  }

  await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } });
}

async function main() {
  console.log("🌱 Seeding Cred Rank Net demo content...");

  await clearDemoData();

  const subredditNames = [
    ...new Set(TAKE_TEMPLATES.map((t) => t.subreddit)),
  ];

  const users = await Promise.all(
    DEMO_USERS.map((persona) =>
      prisma.user.create({
        data: {
          name: persona.name,
          username: persona.username,
          email: `${persona.username}${DEMO_EMAIL_SUFFIX}`,
          emailVerified: new Date(),
          image: `https://i.pravatar.cc/150?u=${persona.username}`,
          credibilityScore: persona.credibilityScore,
          expertise: serializeExpertise(persona.expertise),
        },
      }),
    ),
  );

  console.log(`✅ Created ${users.length} demo users`);

  const subredditRecords = new Map<string, { id: string; name: string }>();

  for (const name of subredditNames) {
    const creator = users[Math.floor(Math.random() * users.length)]!;
    const subreddit = await prisma.subreddit.upsert({
      where: { name },
      update: {},
      create: {
        name,
        creatorId: creator.id,
      },
    });
    subredditRecords.set(name, subreddit);
  }

  console.log(`✅ Ensured ${subredditRecords.size} communities`);

  for (const user of users) {
    const joined = shuffle([...subredditRecords.values()]).slice(
      0,
      4 + Math.floor(Math.random() * 3),
    );
    for (const subreddit of joined) {
      await prisma.subscription
        .create({
          data: { userId: user.id, subredditId: subreddit.id },
        })
        .catch(() => undefined);
    }
  }

  const posts: Array<{ id: string; authorId: string; title: string }> = [];
  let templateOffset = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i]!;
    const takeCount = POSTS_PER_USER[i] ?? 7;
    const takes = pickTakeTemplates(takeCount, templateOffset);
    templateOffset += takeCount;

    for (let j = 0; j < takes.length; j++) {
      const take = takes[j]!;
      const subreddit = subredditRecords.get(take.subreddit);
      if (!subreddit) continue;

      const daysAgo = Math.floor(Math.random() * 45) + j;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const post = await prisma.post.create({
        data: {
          title: take.title,
          content: makeEditorContent(take.paragraphs),
          authorId: user.id,
          subredditId: subreddit.id,
          researchDomain: take.domain,
          credibilityScore: 0,
          createdAt,
        },
      });

      posts.push({ id: post.id, authorId: user.id, title: post.title });
    }
  }

  console.log(`✅ Created ${posts.length} takes (avg ${(posts.length / users.length).toFixed(1)} per user)`);

  const commentSnippets = [
    "Strong framing. I'd push back slightly on the causal claim in paragraph two.",
    "This matches what we're seeing in the literature—especially the policy angle.",
    "Useful take. Would love to see citations on the longitudinal evidence.",
    "Counterpoint: the implementation cost might outweigh the benefit at scale.",
    "Agree on the diagnosis; the remedy needs more operational detail.",
    "We ran a similar analysis last year and landed in the same ballpark.",
  ];

  for (const post of posts) {
    const commentCount = 2 + Math.floor(Math.random() * 3);
    for (let c = 0; c < commentCount; c++) {
      const commenter = users[Math.floor(Math.random() * users.length)]!;
      await prisma.comment.create({
        data: {
          text: commentSnippets[(c + post.title.length) % commentSnippets.length]!,
          authorId: commenter.id,
          postId: post.id,
        },
      });
    }
  }

  console.log("✅ Created comments");

  for (const post of posts) {
    const voters = shuffle(
      users.filter((u) => u.id !== post.authorId),
    ).slice(0, 8 + Math.floor(Math.random() * 7));

    let scoreDelta = 0;

    for (const voter of voters) {
      const type = Math.random() > 0.28 ? VoteType.UP : VoteType.DOWN;
      const weight = computeVoteWeight(voter.credibilityScore, 1);

      await prisma.vote.create({
        data: {
          type,
          userId: voter.id,
          postId: post.id,
          weight,
        },
      });

      scoreDelta += type === VoteType.UP ? weight : -weight;
    }

    const normalized = Math.max(0, Math.min(100, 50 + scoreDelta * 2));
    await prisma.post.update({
      where: { id: post.id },
      data: { credibilityScore: normalized },
    });
  }

  console.log("✅ Created cross-user votes");

  for (const user of users) {
    const authored = await prisma.post.findMany({
      where: { authorId: user.id },
      select: { credibilityScore: true },
    });

    if (authored.length === 0) continue;

    const avgPostScore =
      authored.reduce((sum, post) => sum + post.credibilityScore, 0) /
      authored.length;

    const blended =
      user.credibilityScore * 0.35 + avgPostScore * 0.65;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        credibilityScore: blended,
        lastScoreUpdate: new Date(),
      },
    });
  }

  await recalculateCredibilityRanks(prisma);

  console.log("✅ Updated credibility scores and ranks");
  console.log(
    `🎉 Demo seed complete — ${users.length} users, ${posts.length} takes`,
  );
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
