import { PrismaClient, VoteType } from '@prisma/client'
const prisma = new PrismaClient()

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {
  // 1. Users with expertise
  const academicUsers = [
    {
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@university.edu",
      username: "dr_sarah",
      expertise: "Economics",
      image: "https://i.pravatar.cc/150?img=1",
      credibilityScore: 4.8
    },
    {
      name: "Prof. Michael Chen",
      email: "m.chen@tech.edu",
      username: "prof_chen",
      expertise: "Computer_Science",
      image: "https://i.pravatar.cc/150?img=2",
      credibilityScore: 4.9
    },
    {
      name: "Dr. Emily Williams",
      email: "e.williams@research.org",
      username: "dr_emily",
      expertise: "Medicine",
      image: "https://i.pravatar.cc/150?img=3",
      credibilityScore: 4.7
    },
    {
      name: "Prof. David Brown",
      email: "d.brown@physics.edu",
      username: "prof_brown",
      expertise: "Physics",
      image: "https://i.pravatar.cc/150?img=4",
      credibilityScore: 4.6
    },
    {
      name: "Dr. Lisa Taylor",
      email: "l.taylor@math.edu",
      username: "dr_taylor",
      expertise: "Mathematics",
      image: "https://i.pravatar.cc/150?img=5",
      credibilityScore: 4.8
    }
  ];

  const users = await Promise.all(
    academicUsers.map((user) =>
      prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          username: user.username,
          expertise: user.expertise,
          image: user.image,
          credibilityScore: user.credibilityScore
        },
      })
    )
  )

  // 2. Expertise-based Subreddits
  const expertiseAreas = [
    'Economics',
    'Computer_Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Medicine',
    'Psychology',
    'Sociology',
    'Political_Science',
    'Law',
    'Philosophy',
    'History',
    'Literature',
    'Linguistics',
    'Engineering',
    'Environmental_Science',
    'Business',
    'Finance',
    'Education'
  ];

  const subreddits = await Promise.all(
    expertiseAreas.map((expertise) =>
      prisma.subreddit.create({
        data: {
          name: expertise,
          creatorId: randomElement(users).id,
        },
      })
    )
  )

  // 3. Subscriptions
  for (const user of users) {
    const joinedSubs = subreddits.slice(0, 5)
    for (const sub of joinedSubs) {
      await prisma.subscription.create({
        data: { userId: user.id, subredditId: sub.id },
      })
    }
  }

  // 4. Posts with relevant academic content
  const academicPosts = [
    {
      title: "New Research on Economic Growth Models",
      content: { text: "Recent findings suggest that traditional economic growth models need revision in light of technological disruption." },
      expertise: "Economics"
    },
    {
      title: "Advances in Quantum Computing",
      content: { text: "Breakthrough in quantum error correction could lead to more stable qubits." },
      expertise: "Computer_Science"
    },
    {
      title: "Novel Proof of the Riemann Hypothesis",
      content: { text: "A new approach to proving one of mathematics' most famous unsolved problems." },
      expertise: "Mathematics"
    },
    {
      title: "Dark Matter Detection Breakthrough",
      content: { text: "New experimental results provide strong evidence for dark matter particles." },
      expertise: "Physics"
    },
    {
      title: "Gene Editing Success in Cancer Treatment",
      content: { text: "CRISPR-based therapy shows promising results in clinical trials." },
      expertise: "Medicine"
    }
  ];

  const posts = await Promise.all(
    academicPosts.map(async (post) => {
      const subreddit = subreddits.find(s => s.name === post.expertise)!;
      return prisma.post.create({
        data: {
          title: post.title,
          content: post.content,
          authorId: randomElement(users).id,
          subredditId: subreddit.id,
          credibilityScore: Math.random() * 5
        },
      })
    })
  )

  // 5. Comments
  const comments = await Promise.all(
    Array.from({ length: 20 }).map((_, i) =>
      prisma.comment.create({
        data: {
          text: `Comment ${i + 1}`,
          authorId: randomElement(users).id,
          postId: randomElement(posts).id,
        },
      })
    )
  )

  // 6. Votes
  for (const post of posts) {
    const voters = users.slice(0, 10)
    for (const voter of voters) {
      await prisma.vote.create({
        data: {
          userId: voter.id,
          postId: post.id,
          type: Math.random() > 0.5 ? VoteType.UP : VoteType.DOWN,
        },
      })
    }
  }

  // 7. CommentVotes
  for (const comment of comments) {
    const voters = users.slice(0, 5)
    for (const voter of voters) {
      await prisma.commentVote.create({
        data: {
          userId: voter.id,
          commentId: comment.id,
          type: Math.random() > 0.5 ? VoteType.UP : VoteType.DOWN,
        },
      })
    }
  }

  console.log('Database seeded with sample data.')
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())
