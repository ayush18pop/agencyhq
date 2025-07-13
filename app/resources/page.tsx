import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ResourcesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Resources</h2>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <h3 className="font-semibold">Knowledge Base</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Access company knowledge and documentation.
          </p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <h3 className="font-semibold">Templates</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Use project and document templates.
          </p>
        </div>
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <h3 className="font-semibold">Assets</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Manage brand assets and files.
          </p>
        </div>
      </div>
    </div>
  );
}
