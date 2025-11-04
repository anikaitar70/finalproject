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
import { formatCredibilityScore, formatCredibilityTitle } from "~/lib/number-formatting";
import { type PostVoteRequest } from "~/lib/validators/vote";
import { VoteCooldown } from "./vote-cooldown";

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
  const [credibility, setCredibility] = useState<number>(0);
  const [currentVote, setCurrentVote] = useState<typeof initialVote>(null);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCredibility(initialCredibility);
    setCurrentVote(initialVote);
    setMounted(true);
  }, [initialCredibility, initialVote]);
  const prevVote = usePrevious(currentVote);
  const { loginToast } = useCustomToasts();

  const { mutate: vote } = useMutation({
    mutationFn: async (voteType: VoteType) => {
      const payload: PostVoteRequest = { postId, voteType };

      const { data } = await axios.patch("/api/subreddit/post/vote", payload);
      return data;
    },

    onSuccess: (data) => {
      // Update local credibility state with the new score
      setCredibility(data.postScore);

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
      // Revert to previous credibility on error
      setCredibility(initialCredibility);
      
      // reset current vote
      setCurrentVote(prevVote);

      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          return loginToast();
        }
        if (err.response?.status === 429) {
          setIsInCooldown(true);
          return toast({
            title: "Please wait",
            description: "You're voting too quickly. Please wait a few seconds.",
            variant: "default",
          });
        }
      }

      return toast({
        title: "Something went wrong.",
        description: "Your vote was not registered. Please try again.",
        variant: "destructive",
      });
    },

    onMutate: (voteType) => {
      const prevCredibility = credibility;
      
      if (currentVote === voteType) {
        // User is voting the same way again, so remove their vote
        setCurrentVote(undefined);
        // Reverse the effect of the previous vote
        if (voteType === "UP") {
          setCredibility(prev => prev - (prev - initialCredibility));
        } else if (voteType === "DOWN") {
          setCredibility(prev => prev - (prev - initialCredibility));
        }
      } else {
        // User is voting in the opposite direction or first time voting
        setCurrentVote(voteType);
        const voteImpact = voteType === "UP" ? 0.1 : -0.1;
        setCredibility(prev => {
          if (currentVote) {
            // If changing vote direction, first remove old vote then add new
            return prev - (prev - initialCredibility) + voteImpact;
          } else {
            // First time voting
            return prev + voteImpact;
          }
        });
      }

      return { prevCredibility, prevVote: currentVote };
    },
  });

  return (
    <div className="flex flex-col gap-4 pb-4 pr-6 sm:w-20 sm:gap-0 sm:pb-0">
      {/* Upvote */}
      <Button
        onClick={() => !isInCooldown && vote("UP")}
        size="sm"
        variant="ghost"
        aria-label="upvote"
        disabled={isInCooldown}
      >
        <Icons.upvote
          className={cn("h-5 w-5 text-secondary-foreground", {
            "fill-emerald-500 text-emerald-500": currentVote === "UP",
            "opacity-50": isInCooldown,
          })}
        />
      </Button>

      {/* Credibility Score */}
      <div className="flex flex-col items-center">
        {mounted ? (
          <p 
            className="py-2 text-center text-sm font-medium text-secondary-foreground" 
            title={formatCredibilityTitle(credibility)}
          >
            {formatCredibilityScore(credibility)}
          </p>
        ) : (
          <p 
            className="py-2 text-center text-sm font-medium text-secondary-foreground" 
            title={formatCredibilityTitle(initialCredibility)}
          >
            {formatCredibilityScore(initialCredibility)}
          </p>
        )}
        
        {/* Cooldown Indicator */}
        <VoteCooldown 
          isActive={isInCooldown}
          durationSeconds={5}
          onComplete={() => setIsInCooldown(false)}
        />
      </div>

      {/* Downvote */}
      <Button
        onClick={() => !isInCooldown && vote("DOWN")}
        size="sm"
        className={cn({
          "text-emerald-500": currentVote === "DOWN",
        })}
        variant="ghost"
        aria-label="downvote"
        disabled={isInCooldown}
      >
        <Icons.downvote
          className={cn("h-5 w-5 text-secondary-foreground", {
            "fill-red-500 text-red-500": currentVote === "DOWN",
            "opacity-50": isInCooldown,
          })}
        />
      </Button>
    </div>
  );
}
