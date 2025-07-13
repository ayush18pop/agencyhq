import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions); // ← Added await
  
  if (!session) {
    redirect("/login"); // ← Navigate to login
  }
  
  // If user is logged in, redirect to dashboard
  redirect("/dashboard");
  
  // This won't be reached due to redirect above
  return (
    <>
      <h1>Welcome to AgencyOS</h1>
    </>
  );
}


