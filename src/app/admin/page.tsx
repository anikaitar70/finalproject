import { redirect } from "next/navigation";

import { getAdminSession } from "~/server/admin";
import { prisma } from "~/server/db";
import { DataTable } from "./data-table";
import { columns } from "./columns";

export default async function AdminDashboard() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    include: {
      posts: true,
      votes: true,
      comments: true,
    },
  });

  const totalPosts = users.reduce(
    (acc, user) => acc + (user.posts?.length ?? 0),
    0,
  );
  const totalComments = users.reduce(
    (acc, user) => acc + (user.comments?.length ?? 0),
    0,
  );

  return (
    <div className="container py-10">
      <h1 className="mb-8 text-4xl font-bold">Admin Dashboard</h1>

      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Users Overview</h2>
          <DataTable columns={columns} data={users} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-card p-4">
            <h3 className="mb-2 font-semibold">Total Users</h3>
            <p className="text-2xl">{users.length}</p>
          </div>
          <div className="rounded-lg bg-card p-4">
            <h3 className="mb-2 font-semibold">Total Posts</h3>
            <p className="text-2xl">{totalPosts}</p>
          </div>
          <div className="rounded-lg bg-card p-4">
            <h3 className="mb-2 font-semibold">Total Comments</h3>
            <p className="text-2xl">{totalComments}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
