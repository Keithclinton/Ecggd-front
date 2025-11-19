import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import api, { profile as profileApi } from '../../lib/api'
import { isProfileComplete } from '../../lib/helpers'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../components/AuthProvider'

type Course = {
  id: number
  shortname: string
  fullname: string
  summary?: string
}

export default function CourseDetail() {
  const router = useRouter()
  const { id } = router.query
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const auth = useAuth()
  const [enrolling, setEnrolling] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get(`/courses/${id}/`)
      .then(res => setCourse(res.data))
      .catch(err => setError(parseError(err)))
      .finally(() => setLoading(false))
  }, [id])

  const handleEnroll = async () => {
    if (!course || !auth) return
    setEnrolling(true)
    setError('')
    setSuccessMsg('')
    try {
      const me = await profileApi.get()
      const user = me?.data || {}
      if (!isProfileComplete(user)) {
        router.push(`/profile?next=/courses/${course.id}`)
        return
      }
      await api.post('/enrollments/', {
        course: course.id,
        user: auth.user?.id,
        role: 'student'
      })
      setSuccessMsg('Successfully enrolled!')
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-12">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
          {loading && <Spinner size={24} className="mx-auto my-4" />}
          {error && <div className="text-red-600 text-center py-2 bg-red-50 rounded mb-4">{error}</div>}
          {successMsg && <div className="text-green-600 text-center py-2 bg-green-50 rounded mb-4">{successMsg}</div>}

          {course && (
            <>
              <h1 className="text-3xl font-bold text-brand-primary mb-2 text-center">{course.fullname}</h1>
              <p className="text-gray-700 mb-6 text-center">{course.summary}</p>

              <div className="flex justify-center mb-6">
                {auth && auth.access ? (
                  <button
                    disabled={enrolling}
                    onClick={handleEnroll}
                    className={`px-6 py-3 rounded font-semibold text-lg shadow transition flex items-center justify-center gap-3 ${enrolling ? 'bg-brand-primary text-white opacity-60 cursor-not-allowed' : 'bg-brand-primary text-white hover:bg-brand-primary/90'}`}
                    aria-busy={enrolling}
                    aria-disabled={enrolling}
                  >
                    {enrolling ? (
                      <>
                        <Spinner size={18} className="text-white" />
                        <span>Enrolling...</span>
                      </>
                    ) : (
                      'Enroll in this course'
                    )}
                  </button>
                ) : (
                  <button onClick={() => router.push(`/login`)} className="px-6 py-3 rounded border-2 border-brand-primary text-brand-primary font-semibold text-lg shadow hover:bg-brand-primary hover:text-white transition">Login to Enroll</button>
                )}
              </div>

              <h3 className="text-lg font-medium mb-2">Sections & Modules</h3>
              <CourseSections courseId={course.id} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// ---------- Helper Functions ----------
const parseError = (err: any) =>
  typeof err === 'string' ? err : JSON.stringify(err?.response?.data || err.message || 'Unknown error')

// ---------- Sections Component ----------
function CourseSections({ courseId }: { courseId: number }) {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openSection, setOpenSection] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/sections/?course=${courseId}`)
      .then(res => setSections(res.data || []))
      .catch(err => setError(parseError(err)))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <Spinner size={20} className="mx-auto my-4" />
  if (error) return <div className="text-red-600">{error}</div>
  if (!sections.length) return <div className="text-sm text-gray-600 mt-2">No course details available</div>

  return (
    <div className="space-y-2">
      {sections.map(s => (
        <div key={s.id} className="border rounded">
          <button
            onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
            className="w-full text-left p-3 font-semibold bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
          >
            {s.title}
            <span>{openSection === s.id ? '−' : '+'}</span>
          </button>
          {openSection === s.id && <CourseModules sectionId={s.id} />}
        </div>
      ))}
    </div>
  )
}

// ---------- Modules Component ----------
function CourseModules({ sectionId }: { sectionId: number }) {
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get(`/modules/?section=${sectionId}`)
      .then(res => setModules(res.data || []))
      .catch(err => setError(parseError(err)))
      .finally(() => setLoading(false))
  }, [sectionId])

  if (loading) return <div className="text-sm text-gray-600 mt-2">Loading modules...</div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!modules.length) return <div className="text-sm text-gray-600 mt-2">No modules available</div>

  return (
    <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
      {modules.map(m => (
        <li key={m.id}>{m.name} — <span className="text-xs text-gray-500">{m.module_type}</span></li>
      ))}
    </ul>
  )
}
