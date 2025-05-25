import Link from "next/link"
import Image from "next/image"
import { Instagram, Linkedin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="mb-4">
              <Image src="/images/logo-transparent.png" alt="Glow Up Diaries" width={120} height={50} />
            </div>
            <p className="text-sm text-gray-400">
              Connect young ambitious people to opportunities, events, and free resources.
            </p>
            <div className="flex space-x-4">
              <Link href="https://www.instagram.com/tochis.takes" className="hover:text-primary">
                <Instagram className="h-6 w-6" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="https://www.linkedin.com/in/tochi-ifeanyi" className="hover:text-primary">
                <Linkedin className="h-6 w-6" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="https://tiktok.com/@tochis.takes" className="hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.0004 2V8.41396C10.5947 8.33909 10.1768 8.3 9.75039 8.3C5.96724 8.3 2.90039 11.3668 2.90039 15.15C2.90039 18.9332 5.96724 22 9.75039 22C13.5335 22 16.6004 18.9332 16.6004 15.15V11.4136C17.6366 11.8539 18.7662 12.1 20.0005 12.1H21.0005V6.5H20.0005C18.0966 6.5 16.6004 4.96259 16.6004 3V2H11.0004ZM13.0004 4H14.688C15.0818 6.22009 16.7673 7.99607 19.0005 8.4091V10.0282C17.9624 9.87602 17.0253 9.48645 16.1567 8.905L14.6004 7.86327V15.15C14.6004 17.8286 12.429 20 9.75039 20C7.07181 20 4.90039 17.8286 4.90039 15.15C4.90039 12.4714 7.07181 10.3 9.75039 10.3C9.83431 10.3 9.91769 10.3021 10.0005 10.3063V11.9095C9.91795 11.9032 9.83454 11.9 9.75039 11.9C7.95547 11.9 6.50039 13.3551 6.50039 15.15C6.50039 16.9449 7.95547 18.4 9.75039 18.4C11.5453 18.4 13.0004 16.9449 13.0004 15.15C13.0004 11.4334 12.9992 7.71665 13.0004 4Z" />
                </svg>
                <span className="sr-only">TikTok</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-gray-400 hover:text-brand-orange">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sm text-gray-400 hover:text-brand-orange">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/opportunities" className="text-sm text-gray-400 hover:text-brand-orange">
                  Opportunities
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-sm text-gray-400 hover:text-brand-orange">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-sm text-gray-400 hover:text-brand-orange">
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold">Submit</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/submit?type=event" className="text-sm text-gray-400 hover:text-brand-orange">
                  Submit an Event
                </Link>
              </li>
              <li>
                <Link href="/submit?type=opportunity" className="text-sm text-gray-400 hover:text-brand-orange">
                  Submit an Opportunity
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-brand-orange">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Glow Up Diaries. All rights reserved. This is a subsidiary of Outsidee Solutions Ltd
          </p>
        </div>
      </div>
    </footer>
  )
}
