"use client";

import { useEffect, useRef, useState } from "react";
import { useIntersection } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";

import { getInitialVoteCount } from "~/lib/vote-utils";

import { Icons } from "~/components/icons";
import { Post } from "~/components/post/post";
import { INFINITE_SCROLL_PAGINATION_RESULTS } from "~/config";
import { type ExtendedPost } from "~/types/db";

interface PostFeedProps {
  initialPosts: ExtendedPost[];
  subredditName?: string;
  feedType?: 'custom' | 'all';
}

export function PostFeed({ initialPosts, subredditName, feedType }: PostFeedProps) {
  const lastPostRef = useRef<HTMLDivElement | null>(null);
  const [isClient, setIsClient] = useState(false);

  // attach intersection observer but do not attach the ref on server render
  const { ref, entry } = useIntersection({
    root: null,
    threshold: 1,
  });

  const { data: session } = useSession();

  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["infinite-query", { subredditName }],
    queryFn: async ({ pageParam = 1 }) => {
      let query = `/api/posts?limit=${INFINITE_SCROLL_PAGINATION_RESULTS}&page=${pageParam}`;
      
      if (subredditName) {
        query += `&subredditName=${subredditName}`;
      }
      if (feedType) {
        query += `&feedType=${feedType}`;
      }

      const { data } = await axios.get(query);
      return data as ExtendedPost[];
    },
    getNextPageParam: (_, pages) => pages.length + 1,
    initialPageParam: 1,
    initialData: { pages: [initialPosts], pageParams: [1] },
  });

  useEffect(() => {
    // mark client after mount so server and client markup match
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (entry?.isIntersecting) {
      void fetchNextPage();
    }
  }, [entry, fetchNextPage]);

  const posts = data?.pages.flatMap((page) => page).filter((post, index, self) =>
    index === self.findIndex((p) => p.id === post.id)
  ) ?? initialPosts;

  return (
    <div className="col-span-2 flex flex-col space-y-6" ref={lastPostRef}>
      {posts.map((post, index) => {
        const voteCount = getInitialVoteCount(post.votes);
        const rawCurrentVote = post.votes.find(
          (vote) => vote.userId === session?.user?.id
        );
        const currentVote = rawCurrentVote
          ? { type: rawCurrentVote.type, weight: rawCurrentVote.weight }
          : undefined;

        const isLast = index === posts.length - 1;

        return (
          <div key={post.id} ref={isLast && isClient ? ref : undefined}>
            <Post
              post={post}
              commentCount={post.comments.length}
              subredditName={post.subreddit.name}
              currentVote={currentVote}
            />
          </div>
        );
      })}

      {isFetchingNextPage && (
        <div className="flex justify-center">
          <Icons.spinner className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      )} 
    </div>
  );
}
