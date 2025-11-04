import { PostFeed } from "~/components/post/post-feed";
import { INFINITE_SCROLL_PAGINATION_RESULTS } from "~/config";
import { prisma } from "~/server/db";

export async function AllFeed() {
  const posts = await prisma.post.findMany({
    orderBy: [
      {
        createdAt: "desc",
      }
    ],
    include: {
      votes: true,
      author: true,
      comments: true,
      subreddit: true,
    },
    // No where clause - this ensures we get ALL posts
    take: INFINITE_SCROLL_PAGINATION_RESULTS,
  });

  return <PostFeed initialPosts={posts} feedType="all" />;
}