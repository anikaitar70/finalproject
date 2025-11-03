import { type Post } from "@prisma/client";
import { Award, BookOpen, Quote } from "lucide-react";

interface PostCredibilityProps {
  post: Post & {
    credibilityScore: number;
    researchDomain?: string | null;
    citationCount?: number;
  };
}

export function PostCredibility({ post }: PostCredibilityProps) {
  return (
    <div className="flex items-center space-x-4 rounded-md border p-2">
      <div className="flex items-center space-x-2">
        <Award className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">
          {post.credibilityScore.toFixed(1)}
        </span>
      </div>

      {post.researchDomain && (
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span className="text-sm">{post.researchDomain}</span>
        </div>
      )}

      {post.citationCount != null ? (
        <div className="flex items-center space-x-2">
          <Quote className="h-4 w-4 text-green-500" />
          <span className="text-sm">{post.citationCount} citations</span>
        </div>
      ) : null}
    </div>
  );
}