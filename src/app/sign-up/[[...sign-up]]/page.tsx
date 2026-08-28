import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/pms/context";

export default function SignUpPage() {
  if (!clerkEnabled()) redirect("/login");
  return (
    <div className="flex min-h-full items-center justify-center bg-cream px-4 py-16">
      <SignUp />
    </div>
  );
}
