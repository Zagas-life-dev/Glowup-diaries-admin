"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const routes = [
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: "Opportunities", path: "/opportunities" },
    { name: "Resources", path: "/resources" },
    { name: "Contact", path: "/contact" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-black text-white">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/images/logo-transparent.png"
            alt="Glow Up Diaries"
            width={120}
            height={30}
            className="mix-blend-normal"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {routes.map((route) => (
            <Link
              key={route.path}
              href={route.path}
              className={`text-sm font-medium transition-colors hover:text-brand-orange ${
                pathname === route.path ? "text-brand-orange" : "text-white"
              }`}
            >
              {route.name}
            </Link>
          ))}
          <Button asChild variant="default" className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            <Link href="/submit">Submit</Link>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <Button variant="ghost" className="md:hidden text-white" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden container py-4 pb-6 bg-black">
          <nav className="flex flex-col space-y-4">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={`text-sm font-medium transition-colors hover:text-brand-orange ${
                  pathname === route.path ? "text-brand-orange" : "text-white"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {route.name}
              </Link>
            ))}
            <Button asChild variant="default" className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white">
              <Link href="/submit" onClick={() => setIsMenuOpen(false)}>
                Submit
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
