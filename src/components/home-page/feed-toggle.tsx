"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";

export function FeedToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const feed = searchParams?.get("feed");
  const feedType = feed || "custom";

  const toggleFeed = (type: "custom" | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("feed", type);
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  return (
    <div className="flex items-center">
      <Button
        onClick={() => toggleFeed(feedType === "custom" ? "all" : "custom")}
        variant="ghost"
        size="sm"
        className="hover:bg-transparent"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span>⇄</span>
        </div>
      </Button>
    </div>
  );
}