"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
// 🛑 Removed: userInitials is no longer needed

export default function Header() {
  let auth: any = null;

  // safe hook
  try {
    auth = useAuth();
  } catch (e) {
    auth = null;
  }

  const isLoggedIn = !!auth?.access;
  const user = auth?.user || null; // Kept for reference, but mostly unused now

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">

        {/* ---- LEFT: LOGO ---- */}
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="CCGD" className="header-logo w-10 h-10" />
          <div>
            <div className="text-lg font-bold text-brand-primary">CCGD</div>
            <div className="text-xs text-gray-500">
              College of Career Guidance & Development
            </div>
          </div>
        </div>

        {/* ---- RIGHT NAVIGATION ---- */}
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="text-gray-700 hover:text-brand-primary">
            Home
          </Link>

          <Link href="/courses" className="text-gray-700 hover:text-brand-primary">
            Courses
          </Link>

          {isLoggedIn && auth ? (
            <>
              <Link
                href="/enrollments"
                className="text-gray-700 hover:text-brand-primary"
              >
                My Courses
              </Link>

              <div className="flex items-center gap-3">
                {/* 🛑 SIMPLIFIED USER DISPLAY */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                  
                  {/* Simple Icon for User Status */}
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>

                  {/* Simple Welcome Message */}
                  <div className="text-sm">
                    <div className="font-medium text-gray-800">
                      {user ? user.username : "Student"}
                    </div>
                  </div>
                </div>

                {/* ---- Logout ---- */}
                <button
                  onClick={auth?.logout} 
                  className="text-gray-700 hover:text-brand-primary"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link href="/login" className="px-3 py-1 rounded bg-brand-primary text-white hover:bg-brand-secondary">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}