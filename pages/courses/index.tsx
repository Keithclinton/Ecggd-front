import { useEffect, useState } from 'react'
import CourseCard from '../../components/CourseCard'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

type Course = {
  id: number
  shortname: string
  fullname: string
  summary?: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/courses/')
      .then((res) => setCourses(res.data || []))
      .catch((err) => setError(err?.response?.data?.detail || err.message || 'Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  const filteredCourses = courses.filter(course =>
    course.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Explore Our Courses</h1>
            <p className="text-lg text-gray-600">Find the perfect course to expand your knowledge.</p>
          </div>
          
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search for a course..."
              className="w-full max-w-lg mx-auto block px-4 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading && (
            <div className="flex justify-center items-center py-10">
              <Spinner size={40} />
            </div>
          )}
          {error && <div className="text-red-600 text-center font-medium py-3 bg-red-100 border border-red-200 rounded-lg mb-4">{String(error)}</div>}
          
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.fullname}
                  summary={course.summary}
                />
              ))}
            </div>
          )}
          {!loading && filteredCourses.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <h3 className="text-2xl font-semibold">No courses found</h3>
              <p>Try adjusting your search term.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
