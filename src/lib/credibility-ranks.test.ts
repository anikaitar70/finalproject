import { describe, expect, it, vi } from "vitest";

import { recalculateCredibilityRanks } from "./credibility-ranks";

describe("recalculateCredibilityRanks", () => {
  it("issues a single window-function rank update", async () => {
    const executeRaw = vi.fn().mockResolvedValue(1);

    await recalculateCredibilityRanks({ $executeRaw: executeRaw });

    expect(executeRaw).toHaveBeenCalledOnce();
  });
});
