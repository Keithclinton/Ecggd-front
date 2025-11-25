import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Spinner from '../../components/Spinner';
import RequireAuth from '../../components/RequireAuth';
import Link from 'next/link';

// Define the basic structure for Course and Course Content
type CourseModule = {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: { id: number; title: string; order: number; content: string }[];
};

type Course = {
  id: number;
  shortname: string;
  fullname: string;
  summary: string;
  modules: CourseModule[];
  // Assume other fields like teacher, duration, etc.
};

export default function CourseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const courseId = id ? parseInt(id as string, 10) : null;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false); // New state for enrollment status

  useEffect(() => {
    if (!courseId) return;

    async function fetchCourseData() {
      setLoading(true);
      setError('');
      try {
        // 1. Check Enrollment Status
        // This API call checks if the currently logged-in user is enrolled in this course ID
        const enrollmentRes = await api.get(`/enrollments/check/?course=${courseId}`);
        
        if (enrollmentRes.status === 200 && enrollmentRes.data.is_enrolled) {
          setIsEnrolled(true);

          // 2. Fetch Course Details (only if authorized/enrolled)
          const courseRes = await api.get(`/courses/${courseId}/`);
          setCourse(courseRes.data);
        } else {
          // If the backend explicitly says 'not enrolled'
          setIsEnrolled(false);
          // Redirect to dashboard if the user is not assigned this course
          router.push('/'); 
          setError('You are not assigned to this course. Redirecting to dashboard.');
        }

      } catch (err: any) {
        // Handle API failure (e.g., 404 if course doesn't exist, 403 if enrollment check fails)
        const status = err.response?.status;
        if (status === 404 || status === 403) {
          setError('Course not found or access denied. Redirecting to dashboard.');
          router.push('/');
        } else {
          setError(err.message || 'Failed to load course data.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCourseData();
  }, [courseId, router]);

  if (loading) {
    return (
      <RequireAuth>
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
          <Spinner size={50} />
        </div>
      </RequireAuth>
    );
  }

  // This error check catches errors that happen before or after the enrollment check
  if (error && !isEnrolled) {
    return (
      <RequireAuth>
        <div className="min-h-screen p-8 text-center bg-red-50 text-red-700">
          <p className="font-semibold">{error}</p>
          <Link href="/" className="text-brand-primary underline mt-2 inline-block">Go to Dashboard</Link>
        </div>
      </RequireAuth>
    );
  }

  if (!course || !isEnrolled) {
    // Fallback safety net if loading finishes but we still don't have course data or enrollment confirmation
    return (
      <RequireAuth>
        <div className="min-h-screen p-8 text-center text-gray-600 bg-gray-50">
          <h1 className="text-2xl font-bold mt-10">Access Denied</h1>
          <p>You must be enrolled in this course to view its content.</p>
          <Link href="/" className="text-brand-primary underline mt-4 inline-block">Return to My Courses</Link>
        </div>
      </RequireAuth>
    );
  }

  // Render Course Content
  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-10 px-4">
          
          <h1 className="text-4xl font-extrabold text-brand-primary mb-2">{course.fullname}</h1>
          <p className="text-gray-600 mb-8">{course.summary}</p>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Course Modules</h2>
            
            {course.modules.sort((a, b) => a.order - b.order).map((module) => (
              <div key={module.id} className="bg-white p-6 rounded-lg shadow border-t-4 border-brand-secondary">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Module {module.order}: {module.title}</h3>
                <p className="text-gray-500 mb-4">{module.description}</p>

                <ul className="space-y-2 border-l-2 border-gray-200 pl-4">
                  {module.lessons.sort((a, b) => a.order - b.order).map((lesson) => (
                    <li key={lesson.id} className="text-gray-600 hover:text-brand-primary transition duration-150 cursor-pointer">
                      <span className="font-mono text-xs mr-2 text-brand-secondary">L{lesson.order}</span>
                      {lesson.title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}