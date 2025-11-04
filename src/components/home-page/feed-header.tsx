"use client";

import { useRouter } from "next/navigation";

interface FeedHeaderProps {
  feedType: "custom" | "all";
}

export function FeedHeader({ feedType }: FeedHeaderProps) {
  const router = useRouter();

  const switchFeed = (type: "custom" | "all") => {
    router.replace(`/?feed=${type}`, { scroll: false });
    router.refresh();
  };

  return (
    <div className="flex items-center gap-x-4">
      <button
        onClick={() => switchFeed("custom")}
        className={`text-3xl font-bold md:text-4xl transition-all duration-200 hover:opacity-80 cursor-pointer ${
          feedType === "all" ? "opacity-50 scale-95" : ""
        }`}
      >
        Your Feed
      </button>
      <div className="flex items-center">
        <button
          onClick={() => switchFeed(feedType === "custom" ? "all" : "custom")}
          className="hover:bg-transparent"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span>⇄</span>
          </div>
        </button>
      </div>
      <button
        onClick={() => switchFeed("all")}
        className={`text-3xl font-bold md:text-4xl transition-all duration-200 hover:opacity-80 cursor-pointer ${
          feedType !== "all" ? "opacity-50 scale-95" : ""
        }`}
      >
        General Feed
      </button>
    </div>
  );
}