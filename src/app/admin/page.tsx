import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { prisma } from "~/server/db";

export default async function AdminDashboard() {
  const session = await getServerAuthSession();

  // Check if user is admin
  if (!session?.user || session.user.email !== "anikaitar@gmail.com") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    include: {
      posts: true,
      votes: true,
      comments: true,
    },
  });

  // Derived totals (use any to avoid strict prisma typing issues in the server component)
  const totalPosts = users.reduce((acc, user) => acc + ((user as any).posts?.length ?? 0), 0);
  const totalComments = users.reduce((acc, user) => acc + ((user as any).comments?.length ?? 0), 0);

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Users Overview</h2>
          <DataTable columns={columns} data={users} />
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-card rounded-lg">
            <h3 className="font-semibold mb-2">Total Users</h3>
            <p className="text-2xl">{users.length}</p>
          </div>
          <div className="p-4 bg-card rounded-lg">
            <h3 className="font-semibold mb-2">Total Posts</h3>
            <p className="text-2xl">{totalPosts}</p>
          </div>
          <div className="p-4 bg-card rounded-lg">
            <h3 className="font-semibold mb-2">Total Comments</h3>
            <p className="text-2xl">{totalComments}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
