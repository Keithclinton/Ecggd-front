import { useEffect, useState } from 'react'
import Header from '../../components/Header'
// 🚀 IMPORT THE GUARDS from AuthProvider
import { ProfileRequiredGuard, RequireApplication } from '../../components/AuthProvider' 
import api from '../../lib/api'
import Link from 'next/link'

type Course = {
  id: number
  shortname: string
  fullname: string
  summary?: string
}

// Separate the display logic into a protected component
function CourseListContent() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    // NOTE: Using api.get here assumes it handles the Authorization header correctly
    api.get('/courses/')
      .then((res) => setCourses(res.data || []))
      .catch((err) => setError(err?.response?.data || err.message || 'Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-brand-primary mb-6 text-center">Available Courses</h1>
          {loading && <div className="text-center text-gray-500 mb-4">Loading courses...</div>}
          {error && <div className="text-red-600 text-center font-medium py-2 bg-red-50 rounded mb-4">{String(error)}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}`} className="block">
                <div className="bg-gray-50 rounded-lg shadow hover:shadow-lg transition p-6 h-full flex flex-col justify-between border border-brand-primary/20">
                  <h2 className="text-xl font-semibold text-brand-primary mb-2">{c.fullname}</h2>
                  <p className="text-gray-700 mb-4">{c.summary || c.shortname}</p>
                  <span className="mt-auto text-brand-primary font-medium hover:underline">View Details</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// 🎯 EXPORTED PAGE: Apply the guards here
export default function CoursesPage() {
    return (
        // Note: I'm assuming 'RequireAuth' is already wrapping this page via _app.tsx or similar
        // If not, you should add it here too: <RequireAuth> ... </RequireAuth>

        // 1. Enforce Profile Completion First
        <ProfileRequiredGuard>
            {/* 2. Enforce Application Submission Second */}
            <RequireApplication>
                {/* Only render course list content if both checks pass */}
                <CourseListContent />
            </RequireApplication>
        </ProfileRequiredGuard>
    )
}