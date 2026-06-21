import { describe, expect, it } from "vitest";

import {
  ALPHA,
  BETA,
  computePostConsensus,
  computePostScoreAfterVoteMutation,
  computeVoteWeight,
  MAX_CREDIBILITY,
  MIN_CREDIBILITY,
  resolveVoteMutation,
  reverseVoteDirection,
  updateAuthorCredibility,
  updatePostCredibility,
} from "./credibility";
import { isSelfVote } from "./self-vote";

describe("computeVoteWeight", () => {
  it("is deterministic for identical inputs", () => {
    const first = computeVoteWeight(5, 10);
    const second = computeVoteWeight(5, 10);

    expect(first).toBe(second);
    expect(first).toBeGreaterThan(0);
  });

  it("does not use randomness", () => {
    const weights = Array.from({ length: 20 }, () => computeVoteWeight(3, 7));
    expect(new Set(weights).size).toBe(1);
  });

  it("increases with voter credibility", () => {
    expect(computeVoteWeight(20, 5)).toBeGreaterThan(computeVoteWeight(2, 5));
  });
});

describe("computePostScoreAfterVoteMutation", () => {
  const baseScore = 10;
  const weight = 2.5;

  it("creates an UP vote impact", () => {
    const result = computePostScoreAfterVoteMutation(baseScore, {
      action: "create",
      voteType: "UP",
      weight,
    });

    expect(result).toBeCloseTo(baseScore + ALPHA * weight, 10);
  });

  it("removes an UP vote by reversing its impact", () => {
    const withUp = computePostScoreAfterVoteMutation(baseScore, {
      action: "create",
      voteType: "UP",
      weight,
    });

    const afterRemove = computePostScoreAfterVoteMutation(withUp, {
      action: "remove",
      previousType: "UP",
      previousWeight: weight,
    });

    expect(afterRemove).toBeCloseTo(baseScore, 10);
  });

  it("removes a DOWN vote by reversing its impact", () => {
    const withDown = computePostScoreAfterVoteMutation(baseScore, {
      action: "create",
      voteType: "DOWN",
      weight,
    });

    const afterRemove = computePostScoreAfterVoteMutation(withDown, {
      action: "remove",
      previousType: "DOWN",
      previousWeight: weight,
    });

    expect(afterRemove).toBeCloseTo(baseScore, 10);
  });

  it("flips UP to DOWN with net negative impact (not stacked positive)", () => {
    const withUp = computePostScoreAfterVoteMutation(baseScore, {
      action: "create",
      voteType: "UP",
      weight,
    });

    const afterFlip = computePostScoreAfterVoteMutation(withUp, {
      action: "flip",
      previousType: "UP",
      previousWeight: weight,
      newType: "DOWN",
      newWeight: weight,
    });

    const buggyFlip = updatePostCredibility(withUp, "DOWN", weight);

    expect(afterFlip).toBeCloseTo(baseScore - ALPHA * weight, 10);
    expect(afterFlip).toBeLessThan(buggyFlip);
    expect(afterFlip - withUp).toBeCloseTo(-2 * ALPHA * weight, 10);
  });

  it("flips DOWN to UP with net positive impact", () => {
    const withDown = computePostScoreAfterVoteMutation(baseScore, {
      action: "create",
      voteType: "DOWN",
      weight,
    });

    const afterFlip = computePostScoreAfterVoteMutation(withDown, {
      action: "flip",
      previousType: "DOWN",
      previousWeight: weight,
      newType: "UP",
      newWeight: weight,
    });

    expect(afterFlip).toBeCloseTo(baseScore + ALPHA * weight, 10);
    expect(afterFlip - withDown).toBeCloseTo(2 * ALPHA * weight, 10);
  });

  it("flip from base equals reverse then apply (UP -> DOWN example)", () => {
    const flip = computePostScoreAfterVoteMutation(baseScore, {
      action: "flip",
      previousType: "UP",
      previousWeight: weight,
      newType: "DOWN",
      newWeight: weight,
    });

    const manual =
      updatePostCredibility(
        updatePostCredibility(baseScore, reverseVoteDirection("UP"), weight),
        "DOWN",
        weight,
      );

    expect(flip).toBeCloseTo(manual, 10);
  });
});

describe("resolveVoteMutation", () => {
  it("creates when no existing vote", () => {
    expect(resolveVoteMutation(null, "UP", 2)).toEqual({
      action: "create",
      voteType: "UP",
      weight: 2,
    });
  });

  it("removes when same vote type is submitted again", () => {
    expect(
      resolveVoteMutation({ type: "UP", weight: 2.5 }, "UP", 2.5),
    ).toEqual({
      action: "remove",
      previousType: "UP",
      previousWeight: 2.5,
    });
  });

  it("flips when vote direction changes", () => {
    expect(
      resolveVoteMutation({ type: "UP", weight: 2.5 }, "DOWN", 3),
    ).toEqual({
      action: "flip",
      previousType: "UP",
      previousWeight: 2.5,
      newType: "DOWN",
      newWeight: 3,
    });
  });
});

describe("computePostConsensus", () => {
  it("returns 0 for no votes", () => {
    expect(computePostConsensus([])).toBe(0);
  });

  it("computes average weighted directional sum", () => {
    const consensus = computePostConsensus([
      { type: "UP", weight: 2 },
      { type: "DOWN", weight: 4 },
    ]);

    expect(consensus).toBeCloseTo((2 - 4) / 2, 10);
  });

  it("reflects final vote set after a flip", () => {
    const beforeFlip = computePostConsensus([
      { type: "UP", weight: 2.5 },
      { type: "UP", weight: 1 },
    ]);

    const afterFlip = computePostConsensus([
      { type: "DOWN", weight: 2.5 },
      { type: "UP", weight: 1 },
    ]);

    expect(beforeFlip).toBeCloseTo((2.5 + 1) / 2, 10);
    expect(afterFlip).toBeCloseTo((-2.5 + 1) / 2, 10);
  });
});

describe("updateAuthorCredibility", () => {
  it("moves author score based on consensus", () => {
    const updated = updateAuthorCredibility(5, 2);
    expect(updated).toBeCloseTo(5 + BETA * 2, 10);
  });

  it("clamps to credibility bounds", () => {
    expect(updateAuthorCredibility(MAX_CREDIBILITY, 100)).toBe(MAX_CREDIBILITY);
    expect(updateAuthorCredibility(MIN_CREDIBILITY, -100)).toBe(
      MIN_CREDIBILITY,
    );
  });
});

describe("isSelfVote", () => {
  it("returns true when author and voter match", () => {
    expect(isSelfVote("user-1", "user-1")).toBe(true);
  });

  it("returns false when author and voter differ", () => {
    expect(isSelfVote("user-1", "user-2")).toBe(false);
  });
});
