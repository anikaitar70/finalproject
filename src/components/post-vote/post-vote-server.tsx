import { notFound } from "next/navigation";
import type { Post, Vote } from "@prisma/client";

import { PostVoteClient } from "~/components/post-vote/post-vote-client";
import { getServerAuthSession } from "~/server/auth";

interface PostVoteServerProps {
  postId: string;
  initialCredibility?: number;
  initialVote?: Vote["type"] | null;
  getData?: () => Promise<(Post & { votes: Vote[] }) | null>;
}

export async function PostVoteServer({
  getData,
  postId,
  initialVote,
  initialCredibility,
}: PostVoteServerProps) {
  const session = await getServerAuthSession();

  let credibilityScore = 0;
  let currentVote: Vote["type"] | null | undefined = undefined;

  if (getData) {
    // Fetch post data in component
    const post = await getData();
    if (!post) return notFound();

    credibilityScore = post.credibilityScore;

    currentVote = post.votes.find(
      (vote) => vote.userId === session?.user?.id,
    )?.type;
  } else {
    // Passed as props if we already have the data, otherwise
    // the `getData` function is passed and invoked above
    credibilityScore = initialCredibility ?? 0;
    currentVote = initialVote;
  }

  return (
    <PostVoteClient
      postId={postId}
      initialVote={currentVote}
      initialCredibility={credibilityScore}
    />
  );
}
