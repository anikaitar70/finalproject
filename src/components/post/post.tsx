import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { VoteType } from "@prisma/client";
import type { ExtendedPost, ExtendedVote } from "~/types/db";

import { EditorOutput } from "~/components/editor-output";
import { Icons } from "~/components/icons";
import { PostVoteClient } from "~/components/post-vote/post-vote-client";
import { PostCredibility } from "~/components/credibility/post-credibility";
import { VoteWeight } from "~/components/credibility/vote-weight";
import { formatTimeToNow } from "~/lib/utils";

type PartialVote = Pick<ExtendedVote, "type" | "weight">;

interface PostProps {
  post: ExtendedPost;
  subredditName: string;
  currentVote?: PartialVote;
  commentCount: number;
}

export function Post({
  post,
  currentVote,
  subredditName,
  commentCount,
}: PostProps) {
  const postRef = useRef<HTMLParagraphElement>(null);
  // local state so we can update credibility in real-time
  const [localPost, setLocalPost] = useState(post);
  // listen for credibility events for this post
  useCredibilityEventListener(post.id, setLocalPost);

  return (
    <div className="rounded-md bg-card shadow">
      <div className="flex justify-between px-6 py-4">
        <PostVoteClient
          postId={post.id}
          initialCredibility={post.credibilityScore ?? 0}
          initialVote={currentVote?.type}
        />

        <div className="w-0 flex-1">
          <div className="mt-1 max-h-40 text-xs text-muted-foreground">
            {subredditName ? (
              <>
                <Link
                  className="text-sm text-secondary-foreground underline underline-offset-2"
                  href={`/r/${subredditName}`}
                >
                  r/{subredditName}
                </Link>
                <span className="px-1">•</span>
              </>
            ) : null}
            <span>Posted by u/{post.author.username}</span>{" "}
            {formatTimeToNow(new Date(post.createdAt))}
            {currentVote && (
              <>
                <span className="px-1">•</span>
                <VoteWeight
                  weight={currentVote.weight}
                  type={currentVote.type}
                />
              </>
            )}
          </div>

          <Link href={`/r/${subredditName}/post/${localPost.id}`}>
            <h1 className="py-2 text-lg font-semibold leading-6 text-secondary-foreground">
              {localPost.title}
            </h1>
          </Link>

          <div
            className="relative max-h-40 w-full overflow-clip text-sm"
            ref={postRef}
          >
            <EditorOutput content={localPost.content} />

            {postRef.current?.clientHeight === 160 ? (
              // Blur bottom if content is too long
              <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-secondary to-transparent"></div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="z-20 bg-secondary px-4 py-4 text-sm sm:px-6">
        <div className="mb-2">
          <PostCredibility post={localPost} />
        </div>
        <Link
          href={`/r/${subredditName}/post/${post.id}`}
          className="flex w-fit items-center gap-2"
        >
          <Icons.commentReply className="h-4 w-4" /> {commentCount} comments
        </Link>
      </div>
    </div>
  );
}

// listen for credibility update events and update the relevant post in-place
// This keeps the UI reactive without a global socket implementation
export function useCredibilityEventListener(postId: string, setLocalPost: (p: any) => void) {
  useEffect(() => {
    function handler(e: Event) {
      try {
        // @ts-ignore
        const data = e.detail;
        if (!data) return;
        if (data.postId !== postId) return;

        setLocalPost((prev: any) => ({
          ...prev,
          credibilityScore: data.postScore ?? prev.credibilityScore,
        }));
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener("credibility:update", handler as any);
    return () => window.removeEventListener("credibility:update", handler as any);
  }, [postId, setLocalPost]);
}
