import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { cn } from "~/lib/utils";

interface VoteWeightProps {
  weight: number;
  type: "UP" | "DOWN" | null;
  className?: string;
}

export function VoteWeight({ weight, type, className }: VoteWeightProps) {
  if (!type) return null;

  return (
    <div
      className={cn(
        "flex items-center space-x-1 text-xs",
        type === "UP" ? "text-green-500" : "text-red-500",
        className
      )}
    >
      {type === "UP" ? (
        <ArrowBigUp className="h-3 w-3" />
      ) : (
        <ArrowBigDown className="h-3 w-3" />
      )}
      <span>{weight.toFixed(2)}x</span>
    </div>
  );
}