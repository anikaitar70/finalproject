import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { CommentSection, Icons, PostVoteServer } from "~/components";
import { EditorOutput } from "~/components/editor-output";
import { buttonVariants } from "~/components/ui/button";
import { getCachedPost, parseCachedContent } from "~/lib/redis-cache";
import { formatTimeToNow } from "~/lib/utils";
import { prisma } from "~/server/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

interface PostDetailPageProps {
  params: Promise<{
    postId: string;
  }>;
}

function PostVoteShell() {
  return (
    <div className="flex w-20 flex-col items-center pr-6">
      <div className={buttonVariants({ variant: "ghost" })}>
        <Icons.upvote className="h-5 w-5 text-zinc-700" />
      </div>

      <div className="py-2 text-center text-sm font-medium text-zinc-900">
        <Icons.spinner className="h-3 w-3 animate-spin" />
      </div>

      <div className={buttonVariants({ variant: "ghost" })}>
        <Icons.downvote className="h-5 w-5 text-zinc-700" />
      </div>
    </div>
  );
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const cachedPost = await getCachedPost(postId);

  type LoadedPost = {
    id: string;
    title: string;
    content: Prisma.JsonValue;
    createdAt: Date;
    author: { username: string | null };
  };

  let post: LoadedPost | null = null;

  if (!cachedPost) {
    post = await prisma.post.findFirst({
      where: {
        id: postId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        subredditId: true,
        credibilityScore: true,
        researchDomain: true,
        votes: {
          select: {
            type: true,
            userId: true,
            postId: true,
            weight: true,
            votedAt: true,
            lastWeightUpdate: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            credibilityScore: true,
          },
        },
      },
    });
  }

  if (!post && !cachedPost) {
    return notFound();
  }

  const resolvedPostId = post?.id ?? cachedPost?.id;
  const resolvedTitle = post?.title ?? cachedPost?.title;
  const resolvedAuthorUsername =
    post?.author.username ?? cachedPost?.authorUsername;
  const resolvedCreatedAt = post?.createdAt ?? cachedPost?.createdAt;
  const resolvedContent = post?.content ?? parseCachedContent(cachedPost?.content);

  if (!resolvedPostId || !resolvedTitle || !resolvedAuthorUsername || !resolvedCreatedAt) {
    return notFound();
  }

  const getData = async () => {
    const result = await prisma.post.findUnique({
      where: {
        id: resolvedPostId,
      },
      select: {
        id: true,
        credibilityScore: true,
        votes: {
          select: {
            type: true,
            userId: true,
            weight: true,
          },
        },
      },
    });

    if (!result) {
      return null;
    }

    return result;
  };

  return (
    <div>
      <div className="flex h-full flex-col items-center justify-between sm:flex-row sm:items-start">
        <Suspense fallback={<PostVoteShell />}>
          <PostVoteServer postId={resolvedPostId} getData={getData} />
        </Suspense>

        <div className="w-full flex-1 rounded-sm bg-card p-4 sm:w-0">
          <p className="mt-1 max-h-40 truncate text-xs text-muted-foreground">
            <span>Posted by u/{resolvedAuthorUsername} •</span>{" "}
            {formatTimeToNow(new Date(resolvedCreatedAt))}
          </p>

          <h1 className="py-2 text-xl font-semibold leading-6 text-primary">
            {resolvedTitle}
          </h1>

          <EditorOutput content={resolvedContent} />

          <Suspense
            fallback={
              <Icons.spinner className="h-5 w-5 animate-spin text-zinc-500" />
            }
          >
            <CommentSection postId={resolvedPostId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
