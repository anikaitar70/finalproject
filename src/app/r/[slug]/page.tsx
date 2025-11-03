import { notFound } from "next/navigation";

import { MiniCreatePost, PostFeed } from "~/components";
import { INFINITE_SCROLL_PAGINATION_RESULTS } from "~/config";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

interface SubredditPageProps {
  params: { slug: string };
}

export default async function SubredditPage({ params }: SubredditPageProps) {
  // Await the params and get the slug
  const resolvedParams = await Promise.resolve(params);
  const rawSlug = resolvedParams?.slug;
  
  if (!rawSlug || rawSlug === 'undefined' || typeof rawSlug !== 'string') {
    return notFound();
  }
  
  const slug = decodeURIComponent(rawSlug);

  const session = await getServerAuthSession();

  const subreddit = await prisma.subreddit.findUnique({
    where: { name: slug },
    include: {
      posts: {
        include: {
          author: true,
          comments: true,
          subreddit: true,
          votes: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: INFINITE_SCROLL_PAGINATION_RESULTS,
      },
    },
  });

  if (!subreddit) return notFound();

  return (
    <>
      <h1 className="h-14 text-3xl font-bold md:text-4xl">
        r/{subreddit.name}
      </h1>
      <MiniCreatePost session={session} />
      <PostFeed initialPosts={subreddit.posts} subredditName={subreddit.name} />
    </>
  );
}
