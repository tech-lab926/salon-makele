import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user || user.role !== "artist") {
    redirect("/login");
  }

  const artist = await prisma.user.findUnique({
    where: { id: BigInt(user.userId) },
    select: { name: true },
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar artistName={artist?.name || undefined} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
