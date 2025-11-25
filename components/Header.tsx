"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { userInitials } from "../lib/helpers";

export default function Header() {
  let auth: any = null;

  // safe hook
  try {
    auth = useAuth();
  } catch (e) {
    auth = null;
  }

  // These two lines are safe and well-defined
  const isLoggedIn = !!auth?.access;
  const user = auth?.user || null;

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

          {/* REMOVED: Link to /courses */}
          
          {isLoggedIn && auth ? ( 
            <>
              <Link
                href="/enrollments"
                className="text-gray-700 hover:text-brand-primary"
              >
                My Courses
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">

                  {/* ---- Avatar ---- */}
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture} 
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-semibold">
                      {user ? userInitials(user) : ""}
                    </div>
                  )}

                  {/* ---- User Name ---- */}
                  <div className="text-sm">
                    <div className="font-medium text-gray-800">
                      {user?.first_name
                        ? `${user.first_name} ${user.last_name || ""}`
                        : "Profile"}
                    </div>
                  </div>
                </div>

                {/* ---- Logout ---- */}
                <button
                  onClick={auth?.logout} // Already safe
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