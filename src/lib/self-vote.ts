export function isSelfVote(authorId: string, voterId: string): boolean {
  return authorId === voterId;
}
