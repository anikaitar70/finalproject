import Link from "next/link";
import { CustomFeed, GeneralFeed, Icons } from "~/components";
import { AllFeed } from "~/components/home-page/all-feed";
import { FeedHeader } from "~/components/home-page/feed-header";
import { buttonVariants } from "~/components/ui/button";
import { getServerAuthSession } from "~/server/auth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type FeedType = "custom" | "all";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerAuthSession();

  // Await the searchParams promise before using it
  const params = await searchParams;
  const feedParam = params?.feed;

  const feedType: FeedType =
    typeof feedParam === "string" && feedParam === "all" ? "all" : "custom";

  return (
    <>
      <FeedHeader feedType={feedType} />
      <div className="grid grid-cols-1 gap-y-4 py-6 md:grid-cols-3 md:gap-x-4">
        {/* Always show AllFeed for general feed or when not logged in */}
        {feedType === "all" || !session ? (
          <AllFeed />
        ) : (
          <CustomFeed />
        )}

        {/* Sidebar */}
        <div className="order-first h-fit overflow-hidden rounded-lg border border-secondary md:order-last">
          <div className="bg-secondary px-6 py-4">
            <p className="flex items-center gap-1.5 py-3 font-semibold">
              <Icons.home className="h-4 w-4" />
              Home
            </p>
          </div>
          <div className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
            <div className="flex justify-between gap-x-4 py-3">
              <p className="text-zinc-500">
                Your personal Shreddit frontpage. Come here to check in with
                your favourite communities.
              </p>
            </div>

            <Link
              href="/r/create"
              className={buttonVariants({
                className: "mb-6 mt-4 w-full",
              })}
            >
              Create Community
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
