"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { userInitials } from "../lib/helpers";

export default function Header() {
  let auth = null;

  // Safe hook call (only runs client-side because of "use client")
  try {
    auth = useAuth();
  } catch (e) {
    auth = null; // During SSR or provider missing
  }

  const isLoggedIn = auth?.access;

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* -------- Left: Logo -------- */}
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="CCGD" className="header-logo w-10 h-10" />
          <div>
            <div className="text-lg font-bold text-brand-primary">CCGD</div>
            <div className="text-xs text-gray-500">
              College of Career Guidance & Development
            </div>
          </div>
        </div>

        {/* -------- Right: Navigation -------- */}
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="text-gray-700 hover:text-brand-primary">
            Home
          </Link>

          <Link href="/courses" className="text-gray-700 hover:text-brand-primary">
            Courses
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/enrollments" className="text-gray-700 hover:text-brand-primary">
                My Courses
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                  {auth.user?.profile_picture ? (
                    // show image if available
                    // using img instead of next/image for simplicity inside header
                    <img src={auth.user.profile_picture} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-semibold">
                      {userInitials(auth.user)}
                    </div>
                  )}
                  <div className="text-sm">
                    <div className="font-medium text-gray-800">{auth.user?.first_name ? `${auth.user.first_name} ${auth.user.last_name || ''}` : 'Profile'}</div>
                  </div>
                </div>

                <button
                  onClick={auth.logout}
                  className="text-gray-700 hover:text-brand-primary"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link href="/login" className="text-gray-700 hover:text-brand-primary">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
