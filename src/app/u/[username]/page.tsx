"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import { UserAvatar } from "~/components/user-avatar";
import { UserCredibility } from "~/components/credibility/user-credibility";
import { PostCredibility } from "~/components/credibility/post-credibility";
import { Separator } from "~/components/ui/separator";

interface ProfilePageProps {
  params: {
    username: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  credibilityScore: number;
  credibilityRank: number;
  expertise: string[];
  posts: Array<{
    id: string;
    title: string;
    credibilityScore: number;
    researchDomain: string | null;
    citationCount: number;
    createdAt: string;
  }>;
  _count: {
    posts: number;
    votes: number;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get<UserProfile>(
          `/api/profile?username=${params.username}`
        );
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params.username]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile) {
    return <div>User not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Profile sidebar */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <UserAvatar
              user={{
                name: profile.name || profile.username,
                image: profile.image,
              }}
              className="h-20 w-20"
            />
            <div>
              <h1 className="text-2xl font-bold">u/{profile.username}</h1>
              {profile.name && (
                <p className="text-muted-foreground">{profile.name}</p>
              )}
            </div>
          </div>

          <UserCredibility user={profile} />

          <div className="rounded-md border p-4">
            <h3 className="font-semibold">Activity</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">
                {profile._count.posts} posts
              </p>
              <p className="text-sm text-muted-foreground">
                {profile._count.votes} votes cast
              </p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="md:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Top Contributions</h2>
          <div className="space-y-4">
            {profile.posts.map((post) => (
              <div key={post.id} className="rounded-lg border p-4">
                <h3 className="mb-2 font-medium">{post.title}</h3>
                <PostCredibility post={post} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}