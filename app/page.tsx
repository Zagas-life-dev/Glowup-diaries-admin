import { createServerSupabaseClient } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = createServerSupabaseClient();

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If not authenticated, show login screen (without signup option)
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Glow Up Diaries Admin</h1>
            <p className="mt-2 text-gray-600">Please login to access the admin area</p>
          </div>
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/admin/login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is an admin
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  // If not an admin, show access denied message
  if (!adminUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You don't have admin privileges.</p>
          <Button asChild variant="outline">
            <Link href="/admin/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // If authenticated and admin, show admin welcome with links
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to Admin Portal</h1>
          <p className="mt-2 text-gray-600">Choose an option below to get started</p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/admin/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/events">Manage Events</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/opportunities">Manage Opportunities</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/resources">Manage Resources</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/admin/settings">Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
