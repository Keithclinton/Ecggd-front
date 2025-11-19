import { useEffect, useState } from 'react'
import Header from '../../components/Header'
import RequireAuth from '../../components/RequireAuth'
import api from '../../lib/api'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { profile as profileApi } from '../../lib/api'

export default function EnrollmentsPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function run() {
      setLoading(true)
      setError('')
      try {
        // Ensure profile completeness before allowing enrollments view
        const me = await profileApi.get()
        const u = me?.data || {}
        const required = [u.first_name, u.last_name, u.phone_number, u.date_of_birth, u.gender, u.address]
        const complete = required.every(Boolean)
        if (!complete) {
          router.replace('/profile?next=/enrollments')
          return
        }
        const res = await api.get('/enrollments/')
        const data = res.data || []
        const withCourses = await Promise.all(data.map(async (e: any) => {
          try {
            const c = await api.get(`/courses/${e.course}/`)
            return { ...e, courseObj: c.data }
          } catch (err) {
            return e
          }
        }))
        setEnrollments(withCourses)
      } catch (err: any) {
        setError(err?.response?.data || err.message || 'Failed to load enrollments')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [router])

  return (
    <RequireAuth>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <h1 className="text-2xl font-semibold mb-6">My Courses</h1>
          {loading && <div>Loading enrollments...</div>}
          {error && <div className="text-red-600">{String(error)}</div>}
          <div className="space-y-4">
            {enrollments.map((e) => (
              <div key={e.id} className="border rounded p-4">
                <h3 className="font-semibold">{e.courseObj?.fullname || `Course #${e.course}`}</h3>
                <div className="text-sm text-gray-600 mt-2">Enrolled at: {e.enrolled_at || 'N/A'}</div>
                {e.courseObj && <Link href={`/courses/${e.courseObj.id}`} className="text-sm text-brand-primary mt-2 inline-block">View course</Link>}
              </div>
            ))}
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
