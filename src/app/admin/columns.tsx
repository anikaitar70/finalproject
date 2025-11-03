"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { type User } from "@prisma/client";

export type UserWithActivity = User & {
  posts: { id: string; title: string; credibilityScore: number }[];
  votes: any[];
  comments: any[];
};

export const columns: ColumnDef<UserWithActivity>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "credibilityScore",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Credibility Score
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const score = row.getValue("credibilityScore") as number;
      return <div className="font-medium">{score.toFixed(2)}</div>;
    },
  },
  {
    id: "posts",
    header: "Posts",
    cell: ({ row }) => {
      const posts = row.original.posts;
      return <div>{posts.length}</div>;
    },
  },
  {
    id: "votes",
    header: "Votes",
    cell: ({ row }) => {
      const votes = row.original.votes;
      return <div>{votes.length}</div>;
    },
  },
  {
    id: "comments",
    header: "Comments",
    cell: ({ row }) => {
      const comments = row.original.comments;
      return <div>{comments.length}</div>;
    },
  },
];