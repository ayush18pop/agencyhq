import { LoginForm } from "@/components/login-form"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
export default async function Page() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect("/dashboard");
    return null;
  }
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
