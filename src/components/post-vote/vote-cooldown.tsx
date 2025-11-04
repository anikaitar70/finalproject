"use client";

import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

interface VoteCooldownProps {
  isActive: boolean;
  durationSeconds?: number;
  onComplete?: () => void;
}

export function VoteCooldown({
  isActive,
  durationSeconds = 5,
  onComplete,
}: VoteCooldownProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    const startTime = Date.now();
    const endTime = startTime + durationSeconds * 1000;

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const total = durationSeconds * 1000;
      const newProgress = Math.min((elapsed / total) * 100, 100);

      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setIsVisible(false);
        onComplete?.();
      }
    };

    requestAnimationFrame(updateProgress);
  }, [isActive, durationSeconds, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="relative mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn(
          "absolute left-0 top-0 h-full bg-primary transition-all duration-100",
          isActive ? "opacity-100" : "opacity-0"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}