import { type User } from "@prisma/client";
import { BadgeCheck } from "lucide-react";

import { Card } from "../ui/card";

interface UserCredibilityProps {
  user: User & {
    credibilityScore: number;
    credibilityRank: number;
    expertise: string[];
  };
}

export function UserCredibility({ user }: UserCredibilityProps) {
  // Get badge color based on credibility score
  const getBadgeColor = (score: number) => {
    if (score >= 40) return "text-green-500";
    if (score >= 25) return "text-blue-500";
    if (score >= 10) return "text-yellow-500";
    return "text-gray-500";
  };

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-2">
        <BadgeCheck className={getBadgeColor(user.credibilityScore)} />
        <h3 className="font-semibold">Scholar Stats</h3>
      </div>
      
      <div className="mt-3 space-y-2">
        <div>
          <span className="text-sm text-muted-foreground">Credibility Score:</span>
          <span className="ml-2 font-medium">
            {user.credibilityScore.toFixed(1)}
          </span>
        </div>
        
        <div>
          <span className="text-sm text-muted-foreground">Scholar Rank:</span>
          <span className="ml-2 font-medium">#{user.credibilityRank}</span>
        </div>

        <div>
          <span className="text-sm text-muted-foreground">Expertise:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {user.expertise.map((domain) => (
              <span
                key={domain}
                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
              >
                {domain}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}