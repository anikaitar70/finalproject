import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { JoinLeaveToggle, ToFeedButton } from "~/components";
import { buttonVariants } from "~/components/ui/button";
import { getServerAuthSession } from "~/server/auth";
import { prisma } from "~/server/db";

interface LayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export default async function Layout(props: LayoutProps) {
  const { children } = props;
  
  // Await the params and get the slug
  const params = await Promise.resolve(props.params);
  const rawSlug = params?.slug;
  
  if (!rawSlug || rawSlug === 'undefined' || typeof rawSlug !== 'string') {
    return notFound();
  }
  
  const slug = decodeURIComponent(rawSlug);

  const session = await getServerAuthSession();

  const subreddit = await prisma.subreddit.findUnique({
    where: { name: slug },
    include: {
      posts: {
        include: {
          author: true,
          votes: true,
        },
      },
    },
  });

  const subscription = !session?.user
    ? undefined
    : await prisma.subscription.findFirst({
        where: {
          subreddit: {
            name: slug,
          },
          user: {
            id: session.user.id,
          },
        },
      });

  const isSubscribed = !!subscription;

  if (!subreddit) return notFound();

  const memberCount = await prisma.subscription.count({
    where: {
      subreddit: {
        name: slug,
      },
    },
  });

  return (
    <div className="mx-auto h-full max-w-7xl pt-12 sm:container">
      <div>
        <ToFeedButton />

        <div className="grid grid-cols-1 gap-y-4 py-6 md:grid-cols-3 md:gap-x-4">
          <ul className="col-span-2 flex flex-col space-y-6">{children}</ul>

          {/* Info Sidebar */}
          <div className="order-first h-fit overflow-hidden rounded-lg border border-secondary text-gray-500 dark:text-gray-400 md:order-last">
            <div className="bg-secondary px-6 py-4">
              <p className="py-3 font-semibold text-secondary-foreground">
                About r/{subreddit.name}
              </p>
            </div>

            <dl className="divide-y divide-secondary space-y-3 px-6 py-4 text-sm leading-6">
              <div className="flex justify-between gap-x-4 py-3">
                <dt>Created</dt>
                <dd>
                  <time dateTime={subreddit.createdAt.toDateString()}>
                    {format(subreddit.createdAt, "MMMM d, yyyy")}
                  </time>
                </dd>
              </div>

              <div className="flex justify-between gap-x-4 py-3">
                <dt>Members</dt>
                <dd className="flex items-start gap-x-2">
                  {memberCount}
                </dd>
              </div>

              {subreddit.creatorId === session?.user?.id && (
                <div className="flex justify-between gap-x-4 py-3">
                  <dt>You created this community</dt>
                  <dd></dd>
                </div>
              )}

              {subreddit.creatorId !== session?.user?.id && (
                <div className="py-3">
                  <dt className="sr-only">Community Actions</dt>
                  <dd>
                    <JoinLeaveToggle
                      isSubscribed={isSubscribed}
                      subredditId={subreddit.id}
                      subredditName={subreddit.name}
                    />
                  </dd>
                </div>
              )}

              <div className="py-3">
                <dt className="sr-only">Post Actions</dt>
                <dd>
                  <Link
                    href={`${slug}/submit`}
                    className={buttonVariants({
                      variant: "secondary",
                      className:
                        "w-full text-secondary-foreground hover:backdrop-brightness-100",
                    })}
                  >
                    Create Post
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
