"use client";

import { useEffect, useState } from "react";
import { usePrevious } from "@mantine/hooks";
import { type VoteType } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

import { Icons } from "~/components/icons";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/use-toast";
import { useCustomToasts } from "~/hooks/use-custom-toasts";
import { cn } from "~/lib/utils";
import { type PostVoteRequest } from "~/lib/validators/vote";

interface PostVoteClientProps {
  postId: string;
  initialCredibility: number;
  initialVote?: VoteType | null;
}

export function PostVoteClient({
  postId,
  initialCredibility,
  initialVote,
}: PostVoteClientProps) {
  // Use null for initial client state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [credibility, setCredibility] = useState<number | null>(null);
  const [currentVote, setCurrentVote] = useState<typeof initialVote | null>(null);
  const prevVote = usePrevious(currentVote);
  const { loginToast } = useCustomToasts();

  // After mount, set the actual initial values
  useEffect(() => {
    setMounted(true);
    setCredibility(initialCredibility);
    setCurrentVote(initialVote);
  }, [initialCredibility, initialVote]);

  const { mutate: vote } = useMutation({
    mutationFn: async (voteType: VoteType) => {
      const payload: PostVoteRequest = { postId, voteType };

      const { data } = await axios.patch("/api/subreddit/post/vote", payload);
      return data;
    },

    onSuccess: (data) => {
      // Dispatch a window event so other components (post, profile) can update in real-time
      try {
        const ev = new CustomEvent("credibility:update", { detail: data });
        window.dispatchEvent(ev);
      } catch (e) {
        // ignore in non-browser environments
      }

      // Show toast with vote weight and post score
      toast({
        title: "Vote registered",
        description: `Weight: ${data.voteWeight.toFixed(2)}x — Post score: ${data.postScore.toFixed(2)}`,
      });
    },

    onError: (err, voteType) => {
      if (voteType === "UP") setCredibility((prev) => (prev ?? 0) - 0.1);
      else setCredibility((prev) => (prev ?? 0) + 0.1);

      // reset current vote
      setCurrentVote(prevVote);

      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          return loginToast();
        }
      }

      return toast({
        title: "Something went wrong.",
        description: "Your vote was not registered. Please try again.",
        variant: "destructive",
      });
    },

    onMutate: (voteType) => {
      if (currentVote === voteType) {
        // User is voting the same way again, so remove their vote
        setCurrentVote(undefined);
        if (voteType === "UP") setCredibility((prev) => (prev ?? 0) - 0.1);
        else if (voteType === "DOWN") setCredibility((prev) => (prev ?? 0) + 0.1);
      } else {
        // User is voting in the opposite direction
        setCurrentVote(voteType);
        if (voteType === "UP")
          setCredibility((prev) => (prev ?? 0) + (currentVote ? 0.2 : 0.1));
        else if (voteType === "DOWN")
          setCredibility((prev) => (prev ?? 0) - (currentVote ? 0.2 : 0.1));
      }
    },
  });

  return (
    <div className="flex flex-col gap-4 pb-4 pr-6 sm:w-20 sm:gap-0 sm:pb-0">
      {/* Upvote */}
      <Button
        onClick={() => vote("UP")}
        size="sm"
        variant="ghost"
        aria-label="upvote"
      >
        <Icons.upvote
          className={cn("h-5 w-5 text-secondary-foreground", {
            "fill-emerald-500 text-emerald-500": currentVote === "UP",
          })}
        />
      </Button>

      {/* Credibility Score */}
      <p className="py-2 text-center text-sm font-medium text-secondary-foreground" title="Credibility Score">
        {mounted ? credibility?.toFixed(1) : initialCredibility.toFixed(1)}
      </p>

      {/* Downvote */}
      <Button
        onClick={() => vote("DOWN")}
        size="sm"
        className={cn({
          "text-emerald-500": currentVote === "DOWN",
        })}
        variant="ghost"
        aria-label="downvote"
      >
        <Icons.downvote
          className={cn("h-5 w-5 text-secondary-foreground", {
            "fill-red-500 text-red-500": currentVote === "DOWN",
          })}
        />
      </Button>
    </div>
  );
}
