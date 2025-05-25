"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { LayoutDashboard, Calendar, Users, FileText, ClipboardList, Settings, LogOut, Menu, X, MessageSquare } from "lucide-react"

interface AdminSidebarProps {
  user: {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
  }
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Events",
      href: "/admin/events",
      icon: Calendar,
      description: "Manage events and submissions",
    },
    {
      name: "Opportunities",
      href: "/admin/opportunities",
      icon: Users,
      description: "Manage opportunities and submissions",
    },
    {
      name: "Resources",
      href: "/admin/resources",
      icon: FileText,
      description: "Manage educational resources",
    },
    {
      name: "Feedback",
      href: "/admin/feedback",
      icon: MessageSquare,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "Manage your account settings",
    },

  ]

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setCollapsed(!collapsed)} className="bg-white">
          {collapsed ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-black text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          collapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-800">
            <Link href="/admin/dashboard" className="flex items-center justify-center">
              <Image src="/images/logo-transparent.png" alt="Glow Up Diaries" width={150} height={40} />
            </Link>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold">
                {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.full_name || "Admin User"}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors ${
                      pathname === item.href || pathname?.startsWith(`${item.href}/`)
                        ? "bg-brand-orange text-white"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                    onClick={() => setCollapsed(true)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setCollapsed(true)}></div>
      )}
    </>
  )
}
