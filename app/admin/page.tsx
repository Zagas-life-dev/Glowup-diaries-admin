import { createServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = createServerSupabaseClient();

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.log("No session found, redirecting to login page.");
    redirect("/admin/login");
  }

  return (
    <div>
      <h1>Welcome to the Admin Page</h1>
      {/* Add admin dashboard or other content here */}
    </div>
  );
}